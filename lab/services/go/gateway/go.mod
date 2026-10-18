module lab.example/gateway

go 1.21

require (
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/gin-gonic/gin v1.6.3
	golang.org/x/net v0.10.0
	lab.example/legacykit v0.1.0
)

replace lab.example/legacykit => ../legacykit
