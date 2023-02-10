package functionexecuter

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path"
	"plugin"
	"reflect"
	"runtime"
	"strconv"

	fr "codedistribution/fragmentregistry"
	"codedistribution/models"
	"codedistribution/util"
)

func New() {

	// testFunctionCall(0, []interface{}{2, 3})
	// testFunctionCall("GenObj", []interface{}{"😍works", 27})
	// testFunctionCall("GenObj", []interface{}{"ºRFl¶é(÷LõÎW0 Náò8ìÉPPv\\0", 27})
}

// suppresses any output to the console in the current executing context and resets it afterwards
func quiet() func() {
	null, _ := os.Open(os.DevNull)
	sout := os.Stdout
	serr := os.Stderr
	os.Stdout = null
	os.Stderr = null
	log.SetOutput(null)
	return func() {
		defer null.Close()
		os.Stdout = sout
		os.Stderr = serr
		log.SetOutput(os.Stderr)
	}
}

func loadPlugin(funcId int, functionName string, params []interface{}) ([]byte, error) {
	defer quiet()()

	var file string = strconv.Itoa(funcId) + "_" + functionName + ".so"

	_, currentFilePath, _, _ := runtime.Caller(1)
	cwd := path.Dir(currentFilePath)
	var pluginPath string = path.Join(cwd, "../plugins/", file)

	if ok := util.FileExists(pluginPath); !ok {
		return nil, fmt.Errorf("plugin file for function '%s' does not exist", functionName)
	}

	// Load the plugin from the file
	plug, err := plugin.Open(pluginPath)
	if err != nil {
		return nil, err
	}

	// Lookup the symbol (function)
	symbolPlugin, err := plug.Lookup("Execute__")
	if err != nil {
		return nil, err
	}

	fnValue := reflect.ValueOf(symbolPlugin)
	arguments := []reflect.Value{}

	jsonBytes, _ := json.Marshal(params)
	arguments = append(arguments, reflect.ValueOf(jsonBytes))

	fnResults := fnValue.Call(arguments)

	res := fnResults[0].Interface().([]byte)

	return res, nil
}

/**
  @param {any} funcIdentity - Function name or id
  @param {[]any} funcParams
  @param {chan models.ExecuteResult} channel for communicating with main thread
*/
func Execute(funcIdentity interface{}, funcParams []interface{}, ch chan models.ExecuteResult) {
	defer close(ch)

	var (
		results          []byte
		err              error
		respondToChannel = func(byteData []byte, err error) {
			ch <- models.ExecuteResult{
				ByteData: byteData,
				Err:      err,
			}
		}
	)

	fragmentList := *fr.GetFragmentList()

	switch t_identity := funcIdentity.(type) {
	case int:
		var funcId int = t_identity

		// TODO check if ID exists

		results, err = loadPlugin(
			funcId,
			fragmentList[funcId].Name,
			funcParams,
		)
		if err != nil {
			respondToChannel(nil, err)
		}

		respondToChannel(results, nil)
	case string:

		var funcName string = t_identity
		frag, err := fragmentList.GetFragmentByName(funcName)
		if err != nil {
			respondToChannel(nil, fmt.Errorf("couldn't find funcId for func: '%s'", funcName))
		} else {

			results, err = loadPlugin(
				frag.ID,
				funcName,
				funcParams,
			)
			if err != nil {
				respondToChannel(nil, err)
			}

			respondToChannel(results, nil)
		}
	default:
		respondToChannel(nil, fmt.Errorf("unknown function identity"))
	}
}
