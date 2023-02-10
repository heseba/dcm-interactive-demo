package shared

import (
	"errors"
	"fmt"
	"math"
	"sort"
	"time"
	"webserver/utils"
)

func SortStrings(sortMode string, arr []string) []string {
	var sortedSlice sort.StringSlice = arr

	if sortMode == "asc" && sort.StringsAreSorted(arr) {
		return arr
	}

	switch sortMode {
	case "asc":
		sortedSlice.Sort()
	case "desc":
		sort.Sort(sort.Reverse(sortedSlice))
	default:
		sortedSlice.Sort()
	}

	return sortedSlice
}

func SortFloats(sortMode string, arr []float64) []float64 {
	var sortedSlice sort.Float64Slice = arr

	if sortMode == "asc" && sort.Float64sAreSorted(arr) {
		return arr
	}

	switch sortMode {
	case "asc":
		sortedSlice.Sort()
	case "desc":
		sort.Sort(sort.Reverse(sortedSlice))
	default:
		sortedSlice.Sort()
	}

	return sortedSlice
}

func IncrementNumber(num int) int {
	return num + 1
}

func DecrementNumber(num int) int {
	return num - 1
}

func AddFloats(floats ...float64) float64 {
	var result float64
	for _, value := range floats {
		result += value
	}
	return result
}

func Check() int {
	count := 5
	for i := 0; i < count; i++ {
		time.Sleep(time.Second * 2)
		fmt.Println("Check")
	}
	return 1
}

// 123-456-789
func ValidateCouponInput(input string) (bool, error) {
	if input == "" {
		return false, errors.New("Eingabefeld darf nicht leer sein.")
	} else if len(input) != 11 {
		return false, errors.New("Ungültiger Gutschein Code.")
	}

	return true, nil
}

var validCoupons = []string{
	"491-314-740",
	"780-989-453",
	"301-502-258",
	"337-745-466",
	"285-799-970",
}

func ValidateCoupon(input string) bool {
	return utils.IsStringInSlice(validCoupons, input)
}

func CalcDiscount(total float64, discount float64) float64 {
	if total <= 0 || discount <= 0 {
		return 0
	}

	return (total / 100) * discount
}

func RoundFloat(value float64) float64 {
	return math.Round(value*100) / 100
}
