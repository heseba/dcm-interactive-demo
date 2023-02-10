package routes

import (
	"codedistribution/clientregistry"
	"codedistribution/jwt"
	"codedistribution/models"
	"net/http"
)

// /auth
func HandleAuth(res http.ResponseWriter, req *http.Request) {
	res.Header().Add("Content-Type", "application/json")

	var errorMsg models.JsonResponse = models.JsonResponse{
		Error: &models.JsonError{
			Code:    http.StatusBadRequest,
			Message: http.StatusText(http.StatusBadRequest),
		},
	}

	switch req.Method {
	case http.MethodPost:
		register(res, req)
	default:
		errorMsg.Send(res)
	}

	req.Body.Close()
}

// POST /auth
func register(res http.ResponseWriter, req *http.Request) {
	defer req.Body.Close()

	var errorMsg models.JsonResponse = models.JsonResponse{
		Error: &models.JsonError{
			Code:    http.StatusBadRequest,
			Message: http.StatusText(http.StatusBadRequest),
		},
	}

	// TODO first user when starting server - refactor later with code block below
	// NOTE in this case we can skip any token checks
	if clientregistry.IsEmpty() {
		client := clientregistry.NewClient(req.Host, req.UserAgent())

		jwt_accessToken, err := jwt.CreateJWTAccessToken(client)
		if err != nil {
			errorMsg.Error.Code = http.StatusInternalServerError
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		}
		res.Header().Set("Authorization", jwt_accessToken)

		jwt_refreshCookie, err := jwt.CreateJWTRefreshTokenCookie(client)
		if err != nil {
			errorMsg.Error.Code = http.StatusInternalServerError
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		}
		http.SetCookie(res, jwt_refreshCookie)
		apiResp := &models.JsonResponse{
			Status: "alive",
		}
		apiResp.Send(res)
		return
	}

	// ######### REFRESH TOKEN #########
	authCookie, err := req.Cookie("cdrt")

	/*
	  if there is no http only jwt cookie, create new client entry
	  else check if it's a valid client
	*/
	if err != nil {

		/*
		  check if it's an error which is not related to "cookie not present"
		  if it's not present then just continue with creating a new client
		  cookie might not be present if it was invalidated or naturally expired
		*/
		if err != http.ErrNoCookie {
			errorMsg.Send(res)
			return
		}

		// create a new user, refresh and access token
		client := clientregistry.NewClient(req.Host, req.UserAgent())

		jwt_accessToken, err := jwt.CreateJWTAccessToken(client)
		if err != nil {
			errorMsg.Error.Code = http.StatusInternalServerError
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		}
		res.Header().Set("Authorization", jwt_accessToken)

		jwt_refreshCookie, err := jwt.CreateJWTRefreshTokenCookie(client)
		if err != nil {
			errorMsg.Error.Code = http.StatusInternalServerError
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		}
		http.SetCookie(res, jwt_refreshCookie)
	} else {

		// ######### CHECK REFRESH TOKEN #########
		refreshToken, err := jwt.ValidateJWTRefreshToken(authCookie.Value)

		if err != nil {
			jwt.InvalidateJWTRefreshToken(res)
			errorMsg.Error.Code = http.StatusUnauthorized
			errorMsg.Error.Message = "invalid token"
			errorMsg.Send(res)
			return
		}

		claims, ok := refreshToken.Claims.(*jwt.CustomClaims)
		if !ok {
			jwt.InvalidateJWTRefreshToken(res)
			errorMsg.Send(res)
			return
		}

		// check if user ID is in our system
		client, err := clientregistry.GetClients().GetClientByUUID(claims.Subject)
		if err != nil {
			jwt.InvalidateJWTRefreshToken(res)
			errorMsg.Error.Code = http.StatusUnauthorized
			errorMsg.Error.Message = http.StatusText(http.StatusUnauthorized)
			errorMsg.Send(res)
			return
		}

		if !refreshToken.Valid || client.TokenVersion != claims.TokenVersion {
			client.InvalidateJWT()
			jwt.InvalidateJWTRefreshToken(res)

			errorMsg.Error.Code = http.StatusUnauthorized
			errorMsg.Error.Message = http.StatusText(http.StatusUnauthorized)
			errorMsg.Send(res)
			return
		}

		// TODO maybe renew the expiration date if the client is known

		// ######### SEND NEW ACCESS TOKEN #########

		jwt_accessToken, err := jwt.CreateJWTAccessToken(client)
		if err != nil {
			errorMsg.Error.Code = http.StatusInternalServerError
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		}
		res.Header().Set("Authorization", jwt_accessToken)
	}

	apiResp := &models.JsonResponse{
		Status: "alive",
	}

	apiResp.Send(res)

}
