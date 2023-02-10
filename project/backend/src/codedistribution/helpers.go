package codedistribution

import (
	"fmt"
	"reflect"
	"strings"
)

func PrintVal(v interface{}, depth int) {
	typ := reflect.TypeOf(v).Kind()
	if typ == reflect.Int || typ == reflect.String {
		fmt.Printf("%s%v\n", strings.Repeat(" ", depth), v)
	} else if typ == reflect.Slice { // object
		fmt.Printf("\n")
		printSlice(v.([]interface{}), depth+1)
	} else if typ == reflect.Map { // array
		fmt.Printf("\n")
		printMap(v.(map[interface{}]interface{}), depth+1)
	}
}

func printMap(m map[interface{}]interface{}, depth int) {
	for k, v := range m {
		fmt.Printf("%sKey:%s", strings.Repeat(" ", depth), k.(string))
		PrintVal(v, depth+1)
	}
}

func printSlice(slc []interface{}, depth int) {
	for _, v := range slc {
		PrintVal(v, depth+1)
	}
}
