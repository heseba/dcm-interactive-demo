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

// /clients/{cid}/fragments/{fid}
func HandleFragment(res http.ResponseWriter, req *http.Request) {
	res.Header().Add("Content-Type", "application/json")

	var errorMsg models.JsonResponse = models.JsonResponse{
		Error: &models.JsonError{
			Code:    http.StatusBadRequest,
			Message: http.StatusText(http.StatusBadRequest),
		},
	}

	switch req.Method {
	case http.MethodGet:
		getFragment(res, req)
	case http.MethodPut:
		updateFragment(res, req)
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

// GET /clients/{cid}/fragments/{fid}
func getFragment(res http.ResponseWriter, req *http.Request) {

	var (
		err      error
		errorMsg models.JsonResponse = models.JsonResponse{
			Error: &models.JsonError{
				Code:    http.StatusNotFound,
				Message: http.StatusText(http.StatusNotFound),
			},
		}
	)

	if len(req.URL.Query()) != 0 {
		err = fmt.Errorf("no query expected")
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = err.Error()
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

	fragIdxString, ok := vars["fid"]

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

	fragIdx, err := strconv.Atoi(fragIdxString)

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

	frag, err := client.FragmentStatusList.Index(fragIdx)

	if err != nil {
		errorMsg.Send(res)
		return
	}

	res.WriteHeader(http.StatusOK)
	json.NewEncoder(res).Encode(frag)
}

// PUT /clients/{cid}/fragments/{fid}?runon=(server|client)
func updateFragment(res http.ResponseWriter, req *http.Request) {

	var (
		validRunOnLocations []string            = global.GetConfig().ValidRunOnLocations
		err                 error               = nil
		errorMsg            models.JsonResponse = models.JsonResponse{
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

	fragIdxString, ok := vars["fid"]

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

	fragIdx, err := strconv.Atoi(fragIdxString)

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

	frag, err := client.FragmentStatusList.Index(fragIdx)

	if err != nil {
		errorMsg.Send(res)
		return
	}

	runOn := strings.ToLower(req.URL.Query().Get("runon"))
	if ok := util.IsStringInSlice(validRunOnLocations, runOn); !ok {
		if runOn == "" {
			err = fmt.Errorf("no query specified")
			errorMsg.Error.Code = http.StatusBadRequest
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		} else {
			err = fmt.Errorf("not a valid location to execute")
			errorMsg.Error.Code = http.StatusBadRequest
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		}
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
