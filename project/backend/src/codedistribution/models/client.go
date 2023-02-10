package models

import (
	"encoding/json"
	"fmt"
)

// trim non public informations
type ClientPublic struct {
	Pos                json.Number   `json:"pos,omitempty" type:"integer"`
	UUID               string        `json:"uuid"`
	FragmentStatusList FragmentStati `json:"fragments"`
}
type Client struct {
	ClientPublic
	IP           string
	UserAgent    string
	TokenVersion int
	WS           *WebSocket
}

func (client *Client) InvalidateJWT() {
	client.TokenVersion = client.TokenVersion + 1
}

type Clients []Client

func (clients Clients) Length() int {
	return len(clients)
}

func (clients Clients) GetClientByUUID(uuid string) (*Client, error) {
	for i, client := range clients {
		if client.UUID == uuid {
			return &clients[i], nil
		}
	}

	return nil, fmt.Errorf("client with uuid: '%s' not found", uuid)
}

func (clients Clients) Index(idx int) (*Client, error) {
	if idx <= 0 || idx > len(clients) {
		return nil, fmt.Errorf("no client of index '%d' available", idx)
	}

	client := &clients[idx-1]

	return client, nil
}

func (clients *Clients) Add(client Client) *Clients {
	(*clients) = append((*clients), client)
	return clients
}
