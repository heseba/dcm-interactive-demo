package models

import "encoding/json"

type EventHandler func(*Event)

type Event struct {
	Name string      `json:"event"`
	Data interface{} `json:"data"`
}

func NewEventFromRaw(rawData []byte) (*Event, error) {
	event := new(Event)
	err := json.Unmarshal(rawData, event)
	return event, err
}

// converts data of type Event into json bytes
func (e *Event) Raw() []byte {
	raw, _ := json.Marshal(e)
	return raw
}
