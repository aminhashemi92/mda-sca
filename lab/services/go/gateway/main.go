package main

import (
	"net/http"
	"strings"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"golang.org/x/net/html"
	"lab.example/legacykit"
)

func sign(subject, secret string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"sub": subject})
	return token.SignedString([]byte(secret))
}

func titleText(fragment string) (string, error) {
	node, err := html.Parse(strings.NewReader(fragment))
	if err != nil {
		return "", err
	}
	return node.Data, nil
}

func main() {
	router := gin.New()
	register(router)
}

func register(router *gin.Engine) {
	router.GET("/health", func(c *gin.Context) {
		token, err := sign("northwind", "lab-secret")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		page, err := titleText("<p>order</p>")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		record, err := legacykit.LoadProfile([]byte("currency: IRR\n"))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := legacykit.PrepareStore(c.DefaultQuery("ledger", "ledger.db")); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": token, "page": page, "currency": record["currency"]})
	})
}
