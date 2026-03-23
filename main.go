package main

import (
	"math/rand"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Item struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Price float64 `json:"price"`
}

var items = []Item{
	{ID: 1, Name: "Apple", Price: 1.50},
	{ID: 2, Name: "Banana", Price: 0.75},
	{ID: 3, Name: "Cherry", Price: 3.00},
}

func main() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	r.GET("/items", func(c *gin.Context) {
		c.JSON(http.StatusOK, items)
	})

	r.GET("/items/:id", func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		for _, item := range items {
			if item.ID == id {
				c.JSON(http.StatusOK, item)
				return
			}
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
	})

	r.POST("/items", func(c *gin.Context) {
		var input Item
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		input.ID = rand.Intn(10000) + 100
		c.JSON(http.StatusCreated, input)
	})

	r.Run(":8080")
}
