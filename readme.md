# DCM: Dynamic Client-Server Code Migration

This is the online appendix for the following paper submission:

Heil, S., Haas, J., Gaedke, M.: Enhancing Web Applications with Dynamic Code Migration Capabilities. Submitted to 23rd International Conference on Web Engineering, ICWE 2023.


The repository contains the parts of the DCM demonstrator with the following repository structure:

- `project` the sample e-commerce application, containing
  - `project/backend/src/codedistribution` the DCM runtime infrastructure
  - `project/backend/src/webserver` the sample web shop showcasing the integration of DCM into web applications and extended with an execution location indicator for code fragments
- `decision-system-extension` the Fragment Distribution Control as browser extension, allowing to interactively change the execution location of code fragments at runtime via the DCM REST API
  

To enable easy replication, we are using Docker. Follow the instructions in the readme files in the subdirectories to try it out yourself.


# Acknowledgement
We would like to thank Alexander Senger as main contributor to the interactive DCM demonstrator..
