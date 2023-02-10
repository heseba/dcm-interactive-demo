package clientregistry

import (
	"codedistribution/fragmentregistry"
	"codedistribution/models"
	"encoding/json"
	"fmt"

	"codedistribution/util"
)

var clients models.Clients

func GetClients() *models.Clients {
	return &clients
}

func IsEmpty() bool {
	return clients.Length() == 0
}

func NewClient(ip string, userAgent string) *models.Client {
	var id string

	// generate new IDs as long we get one which doesn't exist
	for {
		id = util.GenerateUUID(50)

		if !ClientExists(id) {
			break
		}
	}

	client := &models.Client{
		ClientPublic: models.ClientPublic{
			Pos:                json.Number(fmt.Sprint(GetClients().Length() + 1)),
			UUID:               id,
			FragmentStatusList: fragmentregistry.GetFragmentStatusList().Clone(),
		},
		IP:           ip,
		UserAgent:    userAgent,
		TokenVersion: 0,
		WS:           nil,
	}

	GetClients().Add(*client)

	return client
}

func ClientExists(id string) bool {
	_, err := GetClients().GetClientByUUID(id)
	return err == nil
}
