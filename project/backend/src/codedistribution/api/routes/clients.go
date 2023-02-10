package routes

import (
	"codedistribution/clientregistry"
	"codedistribution/global"
	"codedistribution/models"
	"codedistribution/util"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// /clients
func HandleClients(res http.ResponseWriter, req *http.Request) {
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
			getClientByQuery(res, req)
			break
		}

		getClients(res, req)
	case http.MethodPut:
		if len(req.URL.Query()) != 0 {
			updateClientByQuery(res, req)
			break
		}
		updateClients(res, req)
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

// GET /clients
func getClients(res http.ResponseWriter, req *http.Request) {
	clientList := *clientregistry.GetClients()

	var clients []models.ClientPublic

	// trim non relevant informations
	for _, client := range clientList {
		clients = append(clients, models.ClientPublic{
			Pos:                client.Pos,
			UUID:               client.UUID,
			FragmentStatusList: client.FragmentStatusList,
		})
	}

	res.WriteHeader(http.StatusOK)

	if len(clients) != 0 {
		json.NewEncoder(res).Encode(clients)
	} else {
		json.NewEncoder(res).Encode([]any{})
	}
}

// GET /clients?uuid={cid}
func getClientByQuery(res http.ResponseWriter, req *http.Request) {
	var (
		uuid     string              = ""
		errorMsg models.JsonResponse = models.JsonResponse{
			Error: &models.JsonError{
				Code:    http.StatusNotFound,
				Message: http.StatusText(http.StatusNotFound),
			},
		}
	)

	queries := req.URL.Query()
	for key, value := range queries {
		if strings.ToLower(key) == "uuid" && len(value) == 1 {
			uuid = value[0]
		}
	}

	if uuid == "" {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	client, err := clientregistry.GetClients().GetClientByUUID(uuid)

	if err != nil {
		errorMsg.Send(res)
		return
	}

	clientPublic := models.ClientPublic{
		UUID:               client.UUID,
		FragmentStatusList: client.FragmentStatusList,
	}

	res.WriteHeader(http.StatusOK)
	json.NewEncoder(res).Encode(clientPublic)
}

// PUT /clients?uuid={cid} + BODY FORM data
// expects array of fragments, not a client
func updateClientByQuery(res http.ResponseWriter, req *http.Request) {
	var (
		validRunOnLocations []string = global.GetConfig().ValidRunOnLocations
		uuid                string   = ""
		fragmentList        models.FragmentStati
		errorMsg            models.JsonResponse = models.JsonResponse{
			Error: &models.JsonError{
				Code:    http.StatusNotFound,
				Message: http.StatusText(http.StatusNotFound),
			},
		}
	)

	// ### CONTENT-TYPE ###

	contentType := req.Header.Get("Content-Type")
	if contentType != "application/json" {
		err := fmt.Errorf("wrong content type")
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = err.Error()
		errorMsg.Send(res)
		return
	}

	// ### CLIENT ###

	queries := req.URL.Query()
	for key, value := range queries {
		if strings.ToLower(key) == "uuid" && len(value) == 1 {
			uuid = value[0]
		}
	}

	if uuid == "" {
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = http.StatusText(http.StatusBadRequest)
		errorMsg.Send(res)
		return
	}

	client, err := clientregistry.GetClients().GetClientByUUID(uuid)

	if err != nil {
		errorMsg.Send(res)
		return
	}

	// ### BODY DATA ###

	err = json.NewDecoder(req.Body).Decode(&fragmentList)
	if err != nil {
		err := fmt.Errorf("could not parse data")
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = err.Error()
		errorMsg.Send(res)
		return
	}

	// check data runon properties, if it's a invalid location to execute
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

	fragments := client.FragmentStatusList
	var fragmentChanged bool = false

	// from request update client here
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
		Status: fmt.Sprintf("Fragments of client '%s' got updated", uuid),
	}
	apiResp.Send(res)
}

// PUT /clients + BODY FORM data (does not update uuid or pos in storage)
func updateClients(res http.ResponseWriter, req *http.Request) {
	var (
		validRunOnLocations []string = global.GetConfig().ValidRunOnLocations
		clientList          []models.ClientPublic
		errorMsg            models.JsonResponse = models.JsonResponse{
			Error: &models.JsonError{
				Code:    http.StatusNotFound,
				Message: http.StatusText(http.StatusNotFound),
			},
		}
	)

	// ### CONTENT-TYPE ###

	contentType := req.Header.Get("Content-Type")
	if contentType != "application/json" {
		err := fmt.Errorf("wrong content type")
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = err.Error()
		errorMsg.Send(res)
		return
	}

	// ### BODY DATA ###

	err := json.NewDecoder(req.Body).Decode(&clientList)
	if err != nil {
		err := fmt.Errorf("could not parse data")
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = err.Error()
		errorMsg.Send(res)
		return
	}

	// check data runon properties for each client regardless if the client exist
	for _, client := range clientList {
		fragmentList := client.FragmentStatusList
		for _, frag := range fragmentList {
			frag.RunOn = strings.ToLower(frag.RunOn)
			if ok := util.IsStringInSlice(validRunOnLocations, frag.RunOn); !ok {
				err := fmt.Errorf("not a valid location to execute for function '%s' on client '%s'", frag.Name, client.UUID)
				errorMsg.Error.Code = http.StatusBadRequest
				errorMsg.Error.Message = err.Error()
				errorMsg.Send(res)
				return
			}
		}
	}

	var changedClients []models.Client

	// from the request
	for _, client := range clientList {
		// lookup client in storage
		cl, err := clientregistry.GetClients().GetClientByUUID(client.UUID)
		if err != nil {
			errorMsg.Error.Code = http.StatusNotFound
			errorMsg.Error.Message = err.Error()
			errorMsg.Send(res)
			return
		}

		// go through the clients fragments of the request
		for _, fragment := range client.FragmentStatusList {
			// lookup fragments of client in storage
			frag, err := cl.FragmentStatusList.GetFragmentById(fragment.ID)
			if err != nil {
				errorMsg.Error.Code = http.StatusNotFound
				errorMsg.Error.Message = err.Error()
				errorMsg.Send(res)
				return
			}

			if frag.RunOn != fragment.RunOn {
				// *frag = fragment
				frag.RunOn = fragment.RunOn
				changedClients = append(changedClients, *cl)
			}
		}
	}

	if len(changedClients) == 0 {
		apiResp := models.JsonResponse{
			Status: "Nothing changed. No new information.",
		}
		apiResp.Send(res)
		return
	}

	// inform all clients where fragments were modified and the connection is alive
	for _, changedClient := range changedClients {
		if changedClient.WS.Conn != nil {
			changedClient.WS.Out <- (&models.Event{
				Name: "updateFragmentList",
				Data: changedClient.FragmentStatusList,
			}).Raw()
		}
	}

	apiResp := models.JsonResponse{
		Status: "Clients updated",
	}
	apiResp.Send(res)
}
