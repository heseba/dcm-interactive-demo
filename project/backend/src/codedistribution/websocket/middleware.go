package websocket

import (
	"codedistribution/clientregistry"
	"codedistribution/jwt"
	"codedistribution/models"
	"codedistribution/util"
	"fmt"
	"net/http"
	"strings"
)

// func getBearerToken(token string) string {
// 	// whitespace is needed
// 	reqToken := strings.Split(token, "Bearer ")

// 	if len(reqToken) != 2 {
// 		return ""
// 	}

// 	return strings.TrimSpace(reqToken[1])
// }

// func getAuthorizationHeader(req *http.Request) (string, bool) {
// 	if authValue := req.Header.Get("Authorization"); authValue != "" {
// 		return authValue, true
// 	}

// 	return "", false
// }

func IsAuthorizedMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {

		var errorMsg models.JsonResponse = models.JsonResponse{
			Error: &models.JsonError{
				Code:    http.StatusBadRequest,
				Message: http.StatusText(http.StatusBadRequest),
			},
		}

		// ######### REFRESH TOKEN BASIC CHECKS #########

		authCookie, err := req.Cookie("cdrt")
		if err != nil {

			// For any other type of error, return a bad request status
			// this also triggers if the cookie is expired
			if err != http.ErrNoCookie {
				errorMsg.Send(res)
				return
			}

			errorMsg.Error.Code = http.StatusUnauthorized
			errorMsg.Error.Message = http.StatusText(http.StatusUnauthorized)
			errorMsg.Send(res)
			return
		}

		_, err = jwt.ValidateJWTRefreshToken(authCookie.Value)

		if err != nil {
			errorMsg.Error.Code = http.StatusUnauthorized
			errorMsg.Error.Message = "invalid token"
			errorMsg.Send(res)
			return
		}

		// ######### ACCESS TOKEN #########

		jwtTokenString := req.URL.Query().Get("cdat")
		if jwtTokenString == "" {
			errorMsg.Error.Code = http.StatusUnauthorized
			errorMsg.Error.Message = http.StatusText(http.StatusUnauthorized)
			errorMsg.Send(res)
			return
		}

		token, err := jwt.ValidateJWTAccessToken(jwtTokenString)

		if err != nil {
			errorMsg.Error.Code = http.StatusInternalServerError
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		}

		if !token.Valid {
			errorMsg.Error.Code = http.StatusUnauthorized
			errorMsg.Error.Message = http.StatusText(http.StatusUnauthorized)
			errorMsg.Send(res)
			return
		}

		fmt.Printf("active client count: %v\n", len(*clientregistry.GetClients()))

		next.ServeHTTP(res, req)
	})
}

// checks if it contains the WS Upgrade Header, firefox also sends "keep-alive"
func isWebSocketRequest(req *http.Request) bool {
	if strings.Contains(req.Header.Get("Connection"), "Upgrade") && req.Header.Get("Upgrade") == "websocket" {
		return true
	}
	return false
}

// check if it's a GET or POST request
func isValidRequestMethod(req *http.Request) bool {
	validRequestTypes := [...]string{"GET", "POST"}
	// dumpRequest(req)
	return util.IsStringInSlice(validRequestTypes[:], req.Method)
}

func WebsocketMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {

		if !isWebSocketRequest(req) {
			res.WriteHeader(http.StatusBadRequest)
			res.Write([]byte("400 - Bad WebSocket Request"))
			// Server will close the request body automatically if body is empty
			// req.Body.Close()
			return
		}

		if !isValidRequestMethod(req) {
			res.WriteHeader(http.StatusForbidden)
			// req.Body.Close()
			return
		}

		// setting subprotocols, multiple possible
		// https://www.iana.org/assignments/websocket/websocket.xml#subprotocol-name
		// var header http.Header = http.Header{}
		// header["Sec-WebSocket-Protocol"] = []string{"wamp"}

		next.ServeHTTP(res, req)

		// Running after handler
	})
}
