# Simple Makefile to perform simple build/deploy steps for
# the Flightassist demo application code

.PHONY: localimage localdeploy

localimage: Dockerfile
	docker build -f Dockerfile -t conversation-service:v1 .

localdeploy: localimage
	source .env && docker run --rm -p 6000:6000 \
	-e WATSON_USERNAME -e WATSON_PASSWORD -e CONV_WORKSPACE_ID conversation-service:v1
