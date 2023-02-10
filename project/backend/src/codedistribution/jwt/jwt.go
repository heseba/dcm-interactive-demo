package jwt

import (
	"codedistribution/global"
	"codedistribution/models"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

func CreateJWTAccessToken(client *models.Client) (string, error) {

	signKey := []byte(global.GetConfig().JWT_ACCESS_SECRET)
	// 1min
	expiresAt_time := time.Now().Add(time.Minute * 5)
	createdAt_time := time.Now()

	claims := &jwt.RegisteredClaims{
		Subject:   client.ClientPublic.UUID,
		IssuedAt:  jwt.NewNumericDate(createdAt_time),
		ExpiresAt: jwt.NewNumericDate(expiresAt_time),
	}

	// claims := jwt.MapClaims{
	// 	"foo":       "bar",
	// 	"ExpiresAt": expiration_time,
	// }

	jwt_token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign and get the complete encoded token as a string using the secret
	return jwt_token.SignedString(signKey)
}

func ValidateJWTAccessToken(jwtTokenString string) (*jwt.Token, error) {
	return jwt.ParseWithClaims(jwtTokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {

		// validate the sign method what you expect
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}

		signKey := []byte(global.GetConfig().JWT_ACCESS_SECRET)

		// function expects returning my signing key
		// https://github.com/golang-jwt/jwt/blob/main/parser.go#L73
		return signKey, nil
	})
}

func GetJWTAccessTokenClaims(jwtTokenString string) (jwt.RegisteredClaims, error) {

	token, err := ValidateJWTAccessToken(jwtTokenString)
	if err != nil {
		return jwt.RegisteredClaims{}, err
	}

	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		return *claims, nil
	} else {
		return jwt.RegisteredClaims{}, fmt.Errorf("claims: invalid access token")
	}
}

func CreateJWTRefreshTokenCookie(client *models.Client) (*http.Cookie, error) {

	signKey := []byte(global.GetConfig().JWT_REFRESH_SECRET)
	sevenDays := time.Hour * 24 * 7
	// fiveSeconds := time.Second * 5
	expiresAt_time := time.Now().Add(sevenDays)
	createdAt_time := time.Now()

	claims := &CustomClaims{
		client.TokenVersion,
		jwt.RegisteredClaims{
			Subject:   client.ClientPublic.UUID,
			IssuedAt:  jwt.NewNumericDate(createdAt_time),
			ExpiresAt: jwt.NewNumericDate(expiresAt_time),
		},
	}

	jwt_token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// Sign and get the complete encoded token as a string using the secret
	signedTokenString, err := jwt_token.SignedString(signKey)

	if err != nil {
		return nil, err
	}

	cookie := &http.Cookie{
		Name:    "cdrt",
		Value:   signedTokenString, // here comes the refresh
		Expires: expiresAt_time,
		// /auth and /ws route (path.Join(global.GetConfig().ApiRoute, "/auth"))
		Path:     "/",
		HttpOnly: true,
		// SameSite settings
		Secure:   false,
		SameSite: http.SameSiteStrictMode,
	}

	return cookie, nil
}

func ValidateJWTRefreshToken(jwtTokenString string) (*jwt.Token, error) {
	return jwt.ParseWithClaims(jwtTokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {

		// validate the sign method what you expect
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}

		signKey := []byte(global.GetConfig().JWT_REFRESH_SECRET)

		// function expects returning my signing key
		// https://github.com/golang-jwt/jwt/blob/main/parser.go#L73
		return signKey, nil
	})
}

func GetJWTRefreshTokenClaims(jwtTokenString string) (CustomClaims, error) {

	token, err := ValidateJWTRefreshToken(jwtTokenString)
	if err != nil {
		return CustomClaims{}, err
	}

	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return *claims, nil
	} else {
		return CustomClaims{}, fmt.Errorf("claims: invalid refresh token")
	}
}

func InvalidateJWTRefreshToken(res http.ResponseWriter) {

	cookie := &http.Cookie{
		Name:   "cdrt",
		MaxAge: -1,
		// /auth and /ws route (path.Join(global.GetConfig().ApiRoute, "/auth"))
		Path: "/",
		// SameSite settings
		Secure:   false,
		SameSite: http.SameSiteStrictMode,
	}

	http.SetCookie(res, cookie)
}
