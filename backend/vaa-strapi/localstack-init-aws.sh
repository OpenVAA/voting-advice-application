#!/bin/bash
AWS_ACCESS_KEY_ID=$AWS_S3_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_S3_ACCESS_SECRET awslocal s3api create-bucket --bucket $AWS_S3_BUCKET --region $AWS_S3_REGION

AWS_ACCESS_KEY_ID=$AWS_S3_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_S3_ACCESS_SECRET awslocal s3api put-bucket-cors --bucket $AWS_S3_BUCKET --region $AWS_S3_REGION --cors-configuration file:///etc/localstack/s3-cors-policy.json

AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY awslocal ses verify-email-identity --email-address $MAIL_FROM --region $AWS_REGION
