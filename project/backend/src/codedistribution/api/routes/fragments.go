package routes

import (
	"codedistribution/clientregistry"
	"codedistribution/global"
	"codedistribution/models"
	"codedistribution/util"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
)

// /clients/{cid}/fragments
func HandleFragments(res http.ResponseWriter, req *http.Request) {
	res.Header().Add("Content-Type", "application/json")
	var errorMsg models.JsonResponse = models.JsonResponse{
		Error: &models.JsonError{
			Code:    http.StatusBadRequest,
			Message: http.StatusText(http.StatusBadRequest),
		},
	}

	switch req.Method {
	case http.MethodGet:

		if len(req.URL.Query()) != 0 {
			getFragmentByQuery(res, req)
			break
		}

		getFragments(res, req)
	case http.MethodPut:
		if len(req.URL.Query()) != 0 {
			updateFragmentByQuery(res, req)
			break
		}
		updateFragments(res, req)
	case http.MethodOptions:
		res.Header().Add("Access-Control-Allow-Headers", "Origin, Content-Type")
		res.Header().Add("Access-Control-Allow-Methods", "PUT")
		res.WriteHeader(200)
		return
	default:
		errorMsg.Send(res)
	}
	req.Body.Close()
}

// GET /clients/{cid}/fragments
func getFragments(res http.ResponseWriter, req *http.Request) {

	var (
		errorMsg models.JsonResponse = models.JsonResponse{
			Error: &models.JsonError{
				Code:    http.StatusNotFound,
				Message: http.StatusText(http.StatusNotFound),
			},
		}
	)

	vars := mux.Vars(req)
	clientIdxString, ok := vars["cid"]

	if !ok {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	clientIdx, err := strconv.Atoi(clientIdxString)
	if err != nil {
		errorMsg.Error.Code = http.StatusInternalServerError
		errorMsg.Error.Message = http.StatusText(http.StatusInternalServerError)
		errorMsg.Send(res)
		return
	}

	client, err := clientregistry.GetClients().Index(clientIdx)
	if err != nil {
		errorMsg.Send(res)
		return
	}

	res.WriteHeader(http.StatusOK)

	if len(client.FragmentStatusList) != 0 {
		json.NewEncoder(res).Encode(client.FragmentStatusList)
	} else {
		json.NewEncoder(res).Encode([]any{})
	}
}

// GET  /clients/{cid}/fragments?id={fid}
func getFragmentByQuery(res http.ResponseWriter, req *http.Request) {
	var (
		fragIdString string              = ""
		errorMsg     models.JsonResponse = models.JsonResponse{
			Error: &models.JsonError{
				Code:    http.StatusNotFound,
				Message: http.StatusText(http.StatusNotFound),
			},
		}
	)

	queries := req.URL.Query()
	for key, value := range queries {
		if strings.ToLower(key) == "id" && len(value) == 1 {
			fragIdString = value[0]
		}
	}

	if fragIdString == "" {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	vars := mux.Vars(req)
	clientIdxString, ok := vars["cid"]

	if !ok {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	clientIdx, err := strconv.Atoi(clientIdxString)

	if err != nil {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	fragId, err := strconv.Atoi(fragIdString)

	if err != nil {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	client, err := clientregistry.GetClients().Index(clientIdx)
	if err != nil {
		errorMsg.Send(res)
		return
	}

	frag, err := client.FragmentStatusList.GetFragmentById(fragId)

	if err != nil {
		errorMsg.Send(res)
		return
	}

	res.WriteHeader(http.StatusOK)
	json.NewEncoder(res).Encode(frag)
}

// PUT  /clients/{cid}/fragments + BODY FORM data
func updateFragments(res http.ResponseWriter, req *http.Request) {
	var (
		validRunOnLocations []string = global.GetConfig().ValidRunOnLocations
		fragmentList        models.FragmentStati
		errorMsg            models.JsonResponse = models.JsonResponse{
			Error: &models.JsonError{
				Code:    http.StatusNotFound,
				Message: http.StatusText(http.StatusNotFound),
			},
		}
	)

	contentType := req.Header.Get("Content-Type")
	if contentType != "application/json" {
		err := fmt.Errorf("wrong content type")
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = err.Error()
		errorMsg.Send(res)
		return
	}

	err := json.NewDecoder(req.Body).Decode(&fragmentList)
	if err != nil {
		err := fmt.Errorf("could not parse data")
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = err.Error()
		errorMsg.Send(res)
		return
	}

	// check data runon properties
	for _, frag := range fragmentList {
		frag.RunOn = strings.ToLower(frag.RunOn)
		if ok := util.IsStringInSlice(validRunOnLocations, frag.RunOn); !ok {
			err := fmt.Errorf("not a valid location to execute for function '%s'", frag.Name)
			errorMsg.Error.Code = http.StatusBadRequest
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		}
	}

	// convert ID to int
	vars := mux.Vars(req)
	clientIdxString, ok := vars["cid"]

	if !ok {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	clientIdx, err := strconv.Atoi(clientIdxString)

	if err != nil {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	client, err := clientregistry.GetClients().Index(clientIdx)
	if err != nil {
		errorMsg.Send(res)
		return
	}

	fragments := client.FragmentStatusList
	var fragmentChanged bool = false

	// from request
	for _, fL := range fragmentList {
		// in stored client
		for i, f := range fragments {
			if fL.ID == f.ID {
				// changes state only when new information is available
				if fL.RunOn != f.RunOn {
					fragments[i].RunOn = fL.RunOn
					fragmentChanged = true
					break
				}
			}
		}
	}

	if !fragmentChanged {
		apiResp := models.JsonResponse{
			Status: "Nothing changed. No new information.",
		}
		apiResp.Send(res)
		return
	}

	// inform client if fragments were modified and the connection is alive
	if client.WS.Conn != nil {
		client.WS.Out <- (&models.Event{
			Name: "updateFragmentList",
			Data: fragments,
		}).Raw()
	}

	apiResp := models.JsonResponse{
		Status: "Fragments updated",
	}
	apiResp.Send(res)
}

// PUT  /clients/{cid}/fragments?id={fid} + BODY FORM data
func updateFragmentByQuery(res http.ResponseWriter, req *http.Request) {
	var (
		validRunOnLocations []string            = global.GetConfig().ValidRunOnLocations
		fragIdString        string              = ""
		runOn               string              = ""
		errorMsg            models.JsonResponse = models.JsonResponse{
			Error: &models.JsonError{
				Code:    http.StatusNotFound,
				Message: http.StatusText(http.StatusNotFound),
			},
		}
	)

	contentType := req.Header.Get("Content-Type")
	if contentType != "application/x-www-form-urlencoded" {
		err := fmt.Errorf("wrong content type")
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = err.Error()
		errorMsg.Send(res)
		return
	}

	// first parse the body form data
	req.ParseForm()
	for key, value := range req.Form {
		if key == "runon" && len(value) == 1 {
			runOn = value[0]
		}
	}

	runOn = strings.ToLower(runOn)
	if ok := util.IsStringInSlice(validRunOnLocations, runOn); !ok {
		if runOn == "" {
			err := fmt.Errorf("no form data specified")
			errorMsg.Error.Code = http.StatusBadRequest
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		} else {
			err := fmt.Errorf("not a valid location to execute")
			errorMsg.Error.Code = http.StatusBadRequest
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		}
	}

	queries := req.URL.Query()
	for key, value := range queries {
		if strings.ToLower(key) == "id" && len(value) == 1 {
			fragIdString = value[0]
		}
	}

	if fragIdString == "" {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	vars := mux.Vars(req)
	clientIdxString, ok := vars["cid"]

	if !ok {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	clientIdx, err := strconv.Atoi(clientIdxString)

	if err != nil {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	fragId, err := strconv.Atoi(fragIdString)

	if err != nil {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	client, err := clientregistry.GetClients().Index(clientIdx)
	if err != nil {
		errorMsg.Send(res)
		return
	}

	frag, err := client.FragmentStatusList.GetFragmentById(fragId)
	if err != nil {
		errorMsg.Send(res)
		return
	}

	if frag.RunOn == runOn {
		apiResp := models.JsonResponse{
			Status: "Nothing changed. No new information.",
		}
		apiResp.Send(res)
		return
	}

	frag.RunOn = runOn

	// inform client if fragment was modified and the connection is alive
	if client.WS.Conn != nil {
		client.WS.Out <- (&models.Event{
			Name: "updateFragmentList",
			Data: client.FragmentStatusList,
		}).Raw()
	}

	apiResp := models.JsonResponse{
		Status: "Fragment updated",
	}
	apiResp.Send(res)
}
