package functionexecuter

import (
	"codedistribution/models"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
	"unicode/utf8"
)

func trimLastRune(s string) string {
	r, size := utf8.DecodeLastRuneInString(s)
	if r == utf8.RuneError && (size == 0 || size == 1) {
		size = 0
	}
	return s[:len(s)-size]
}

func trimFirstRune(s string) string {
	_, i := utf8.DecodeRuneInString(s)
	return s[i:]
}

func trimFirstAndLastRune(str string) string {
	str = trimFirstRune(str)
	str = trimLastRune(str)
	return str
}

func transformStrToByteArray(strArr []string) []byte {

	var myBytes []byte
	buffer := []byte{0, 0}

	for i := 0; i < len(strArr); i++ {
		value, _ := strconv.ParseInt(strArr[i], 10, 64)
		uValue := uint16(value)
		binary.LittleEndian.PutUint16(buffer, uValue)
		myBytes = append(myBytes, buffer[0])
	}

	return myBytes
}

func flattenDeep(args []interface{}, v reflect.Value) []interface{} {

	if v.Kind() == reflect.Interface {
		v = v.Elem()
	}

	if v.Kind() == reflect.Array || v.Kind() == reflect.Slice {
		for i := 0; i < v.Len(); i++ {
			args = flattenDeep(args, v.Index(i))
		}
	} else {
		args = append(args, v.Interface())
	}

	return args
}

func testFunctionCall(funcIdentity interface{}, params []interface{}) {

	ch := make(chan models.ExecuteResult)

	go Execute(funcIdentity, params, ch)

	for res := range ch {
		if res.Err != nil {
			fmt.Println(res.Err.Error())
		}

		var result interface{}
		if err := json.Unmarshal(res.ByteData, &result); err != nil {
			fmt.Println(err.Error())
		}

		fmt.Printf("test function '%v' call: %v\n", funcIdentity, result)
	}
}
