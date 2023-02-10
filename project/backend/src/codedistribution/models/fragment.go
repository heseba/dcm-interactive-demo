package models

import "fmt"

// yaml structure -  file starts with a array of fragments
// uppercase because it needs to be exposed for yaml
type YamlData struct {
	Fragments Fragments `yaml:"fragments"`
}

// yaml structure
type Fragments []Fragment
type Fragment struct {
	ID        int    `yaml:"id"`
	Name      string `yaml:"name"`
	GlobalVar bool   `yaml:"globalVar,omitempty"`
	TypeDef   bool   `yaml:"typeDef,omitempty"`
	RunOn     string `yaml:"runOn,omitempty"`
	Location  struct {
		Filepath string `yaml:"filepath"`
		Start    int    `yaml:"start,omitempty"`
		End      int    `yaml:"end,omitempty"`
	} `yaml:"location"`
	Dependencies []int    `yaml:"dependencies,omitempty"`
	Libs         []string `yaml:"libs,omitempty"`
}

func (fragmentList Fragments) GetFragmentByName(name string) (*Fragment, error) {
	for i, frag := range fragmentList {
		if frag.Name == name {
			return &fragmentList[i], nil
		}
	}

	return nil, fmt.Errorf("fragment: '%s' not found", name)
}

func (fragmentList Fragments) GetFragmentById(id int) (*Fragment, error) {
	for i, frag := range fragmentList {
		if frag.ID == id {
			return &fragmentList[i], nil
		}
	}

	return nil, fmt.Errorf("fragment: #%d not found", id)
}

type FragmentStati []FragmentStatus
type FragmentStatus struct {
	ID    int    `json:"id,string" type:"integer"`
	Name  string `json:"name" type:"string"`
	RunOn string `json:"runOn" type:"string"`
}

func (fragmentStatusList FragmentStati) GetFragmentById(id int) (*FragmentStatus, error) {
	for i, frag := range fragmentStatusList {
		if frag.ID == id {
			return &fragmentStatusList[i], nil
		}
	}

	return nil, fmt.Errorf("fragment: #%d not found", id)
}

func (fragmentStatusList FragmentStati) Index(idx int) (*FragmentStatus, error) {
	if idx <= 0 || idx > len(fragmentStatusList) {
		return nil, fmt.Errorf("no fragment of index '%d' available", idx)
	}

	fragment := &fragmentStatusList[idx-1]

	return fragment, nil
}

func (fragStatusList FragmentStati) Clone() FragmentStati {

	fragList := make(FragmentStati, len(fragStatusList))
	copy(fragList, fragStatusList)
	return fragList
}

// type FragmentStatusList struct {
// 	FragmentStatus []FragmentStatus `json:"fragmentStatusList"`
// }
