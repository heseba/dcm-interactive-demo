package jwt

import "github.com/golang-jwt/jwt/v4"

type CustomClaims struct {
	TokenVersion int `json:"token_version"`
	jwt.RegisteredClaims
}

func (c *CustomClaims) Valid() error {
	// validate custom properties here
	return c.RegisteredClaims.Valid()
}
