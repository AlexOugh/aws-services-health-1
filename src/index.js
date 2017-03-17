
// https://github.com/aws/aws-health-tools/blob/master/sns-topic-publisher/LambdaFunction.js

// Sample Lambda Function to send notifications to a SNS topic when an AWS Health event happens
var AWS = require('aws-sdk');
var sns = new AWS.SNS();

// define configuration
const snsTopic = process.env.HEALTH_TOPIC_ARN;

exports.handler = (event, context, callback) => {
  //extract details from Cloudwatch event
  var healthMessage = event.detail.eventDescription[0].latestDescription + ' For more details, please see https://phd.aws.amazon.com/phd/home?region=us-east-1#/dashboard/open-issues';
  var eventName = event.detail.eventTypeCode
  //prepare message for SNS to publish
  var snsPublishParams = {
    Message: healthMessage,
    Subject: eventName,
    TopicArn: snsTopic
  };
  sns.publish(snsPublishParams, function(err, data) {
    if (err) {
      const snsPublishErrorMessage = `Error publishing AWS Health event to SNS`;
      console.log(snsPublishErrorMessage, err);
      callback(snsPublishErrorMessage);
    }
    else {
      const snsPublishSuccessMessage = `Successfully got details from AWS Health event, ${eventName} and published to SNS topic.`;
      console.log(snsPublishSuccessMessage, data);
      callback(null, snsPublishSuccessMessage);
    }
  });
};
