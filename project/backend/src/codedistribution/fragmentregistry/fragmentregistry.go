package fragmentregistry

import (
	"fmt"
	"os"
  "strings"

	"codedistribution/global"
	"codedistribution/models"
	"codedistribution/util"

	"gopkg.in/yaml.v2"
)

var fragmentList models.Fragments

// reduced variant for public
var fragmentStatusList models.FragmentStati

func GetFragmentList() *models.Fragments {
	return &fragmentList
}
func GetFragmentStatusList() *models.FragmentStati {
	return &fragmentStatusList
}

func fillFragmentList(yamlFile []byte) error {
	var yamlData models.YamlData
	err := yaml.Unmarshal([]byte(yamlFile), &yamlData)
	if err != nil {
		return fmt.Errorf("failed to unmarshal yaml data \nError: %s", err)
	}

	// set default runOn location to 'client' if something abnormal is specified
	var validRunOnLocations []string = global.GetConfig().ValidRunOnLocations
	for i, frag := range yamlData.Fragments {
		if ok := util.IsStringInSlice(validRunOnLocations, frag.RunOn); !ok {
			yamlData.Fragments[i].RunOn = "client"
		}
	}

	// fill array with spread operator
	fragmentList = append(fragmentList, yamlData.Fragments...)

	return nil
}

func isPrivateToFile(str string) bool {
	return str[:1] == strings.ToLower(str[:1])
}

// create and copy only the necessary properties to share between frontend and backend
func fillFragmentStatusList() {
	for _, goFunction := range fragmentList {
		if !(goFunction.TypeDef ||
			goFunction.GlobalVar ||
			isPrivateToFile(goFunction.Name)) {
			fragmentStatusList = append(fragmentStatusList, models.FragmentStatus{
				ID:    goFunction.ID,
				Name:  goFunction.Name,
				RunOn: goFunction.RunOn,
			})
		}
	}
}

func New() error {

	var (
		cfdPath    string = ""
		yamlFile   []byte
		err        error             = nil
		moduleInfo global.ModuleInfo = *global.GetModuleInfo()
	)

	if util.FileExists(moduleInfo.ModulePath + "CFD.yaml") {
		cfdPath = moduleInfo.ModulePath + "CFD.yaml"
	} else if util.FileExists(moduleInfo.ModulePath + "CFD.yml") {
		cfdPath = moduleInfo.ModulePath + "CFD.yml"
	} else {
		return fmt.Errorf("couldn't find CFD.yaml or CDF.yml file")
	}

	yamlFile, err = os.ReadFile(cfdPath)
	if err != nil {
		return fmt.Errorf("couldn't open file '%s'\nError: %v ", cfdPath, err)
	}

	err = fillFragmentList(yamlFile)
	if err != nil {
		return err
	}

	fillFragmentStatusList()

	return nil
}
