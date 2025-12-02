#!/bin/bash
# slack-webhook.sh
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

send_slack_message() {
    local message="$1"
    local color="$2"
    
    curl -X POST -H 'Content-type: application/json' \
    --data "{
        \"attachments\": [
            {
                \"color\": \"$color\",
                \"title\": \"Weather App Deployment\",
                \"text\": \"$message\",
                \"fields\": [
                    {
                        \"title\": \"Build Number\",
                        \"value\": \"$BUILD_NUMBER\",
                        \"short\": true
                    },
                    {
                        \"title\": \"Status\",
                        \"value\": \"$currentBuild.result\",
                        \"short\": true
                    }
                ],
                \"footer\": \"Jenkins CI/CD\",
                \"ts\": $(date +%s)
            }
        ]
    }" $WEBHOOK_URL
}