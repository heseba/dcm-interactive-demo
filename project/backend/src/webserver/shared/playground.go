package shared

import (
	"crypto/sha256"
	"encoding/hex"
)

func Add(a, b int) int {
	return a + b
}

func GetHash(str string) string {
	hasher := sha256.New()
	hasher.Write([]byte(str))
	sha := hasher.Sum(nil)
	return hex.EncodeToString(sha)
}

const Mwst float64 = 19.0

func CalcMwst(value float64) float64 {
	// (value * (100+Mwst)) / 100
	return value * (Mwst/100 + 1)
}

type Person struct {
	Name string
	Age  int
}

func GenObj(name string, age int) *Person {
	return &Person{
		Name: name,
		Age:  age,
	}
}
