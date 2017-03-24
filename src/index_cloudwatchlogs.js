
var uuid = require('node-uuid');
var aws_cloudwatchlog = new (require('aws-services-lib/aws/cloudwatchlog.js'))();

var logGroupName = process.env.HEALTH_LOG_GROUP_NAME;

exports.handler = function (event, context) {

  console.log(event.Records[0].Sns);
  /*
  { Type: 'Notification',
    MessageId: '53a951fc-4eeb-5aa2-824a-00b1f813e042',
    TopicArn: 'arn:aws:sns:us-east-1:290093585298:SungardAS-aws-services-health-HealthTopic-1WQTAS0FUPZLN',
    Subject: 'AWS_LAMBDA_OPERATIONAL_NOTIFICATION',
    Message: 'Your AWS Account currently has currently has Node.js v0.10 functions that were active since March 13 2017. All Node.js v0.10 functions in your account (active or otherwise) must be migrated to Node.js v4.3 or they will cease to operate after April 30th, 2017. Your Node.js v0.10 functions will continue to work until this date as-is and support all features including making updates to code and configuration. This is to keep your production workloads running as usual and to provide time to execute the migration. AWS Lambda is deprecating the Node.js v0.10 runtime, and invocations on Node.js v0.10 functions will fail after this date. Why is this happening? The Node Foundation declared the End-of-Life (EOL) of Node.js v0.10 on Oct 31st 2016[1], which means that it has stopped receiving bug fixes, security updates and performance improvements. We recommend moving onto a version with Long Term Support (LTS) supported with AWS Lambda today (Node v 4.3). We will continue to expand the list of available Node versions in future releases. What has been done to date? AWS Lambda announced Node.js v0.10 deprecation on November 2nd 2016 [2] and turned off the ability to create new functions using this runtime on January 11th 2017. What do you need to do? You must migrate all your Node.js v0.10 functions to Node.js v4.3 before April 30th 2017. After April 30th 2017, invocations to your Node.js v0.10 functions will fail and return an error. Where can I get more information? For more information on migrating to Node.js v4.3 on AWS Lambda, please see the Transitioning Lambda Function Code to Node.js Runtime v4.3 section of our documentation in the AWS Lambda Developer Guide [3] and the AWS Lambda Forums [4]. For general information on Node v4.3 and migrating to it from Node v0.10, please see the Node community documentation related to this topic [5] [6]. For account specific information, e.g., to list all the functions in your account, please use the AWS CLI. Sample commands for a Unix/Bash environment are shown below: # list counts of all Node.js functions aws lambda list-functions --query \'Functions[*].[FunctionName, Runtime]\' | awk \'{ if ( /nodejs/) print $0}\' | sort -n | uniq -c | sort –nr # list Node.js v0.10 functions names aws lambda list-functions --query \'Functions[*].[FunctionName, Runtime]\' | grep -v nodejs4.3 | grep -B1 nodejs| grep , | sort\t [1]: Node Foundation’s announcement of EOL: https://github.com/nodejs/LTS [2]: AWS Lambda forum post for deprecation: https://forums.aws.amazon.com/ann.jspa?annID=4345 [3]: Transitioning to new Node JS runtime: http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-using-old-runtime.html#transition-to-new-nodejs-runtime [4]: AWS Lambda Forum: https://forums.aws.amazon.com/forum.jspa?forumID=186&start=0 [5]: Upgrading Node.js v0.10 applications: https://www.joyent.com/blog/upgrading-nodejs [6]: Changes between v0.10 and v4: https://github.com/nodejs/node/wiki/API-changes-between-v0.10-and-v4 For more details, please see https://phd.aws.amazon.com/phd/home?region=us-east-1#/dashboard/open-issues',
    Timestamp: '2017-03-23T11:42:48.524Z',
    SignatureVersion: '1',
    Signature: 'MK+3UtC76unwjVdti7nnoOH4BDGi0d8ow6RMuRV/fm8NsGzvo1+GM2jodZ3fwtNZnbvayV8I8N5Cr0h1+DQZzUwS8jQTIvw17VSyXLKDYkgfVqG1+ZafSSvi7aB1LNiih+qgpo2OjxZpaUVAX7Lqj0sd3vgzQyS2chZrWaJojLAADsDoW8XW3RKnbPKCBvXs1qvM6WLdmaompJTleJtWf6qTIjJv2GAIm/2xzIt2Nunw9hdi+YHE2ddcpp50UR/iXAsRgiYTWiBlidbdpUz/v2nVjd/3ksawPjR/wXcG0fAoyGLV0ILp4oaVa6kKZh3WUOwkKbTKserBQWBNe3Sq+g==',
    SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-b95095beb82e8f6a046b3aafc7f4149a.pem',
    UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:290093585298:SungardAS-aws-services-health-HealthTopic-1WQTAS0FUPZLN:2b50c958-310d-4061-aea5-a3705ae248d6',
    MessageAttributes: {} }
  */
  var messageId = event.Records[0].Sns.MessageId;
  var subject = event.Records[0].Sns.Subject;
  var message = event.Records[0].Sns.Message;
  var sentBy = event.Records[0].Sns.TopicArn;
  var sentAt = event.Records[0].Sns.Timestamp;

  // find the region and account id
  var tokens = event.Records[0].Sns.TopicArn.split(':');
  var region = tokens[3];
  var awsid = tokens[4];

  function succeeded(input) { context.done(null, true); }
  function failed(err) { context.fail(err, null); }
  function errored(err) { context.fail(err, null); }

  var logMessage = {
    "awsid": awsid,
    "subject": subject,
    "message": message,
    "sentBy": sentBy,
    "sentAt": sentAt
  };

  var input = {
    region: region,
    groupName: logGroupName,
    streamName: sentAt.replace(/:/g, '') + "-" + uuid.v4(),
    logMessage: JSON.stringify(logMessage),
    //timestamp: (new Date(sentAt)).getTime()
    timestamp: (new Date()).getTime()
  };
  console.log(input);

  var flows = [
    {func:aws_cloudwatchlog.findLogGroup, success:aws_cloudwatchlog.findLogStream, failure:aws_cloudwatchlog.createLogGroup, error:errored},
    {func:aws_cloudwatchlog.createLogGroup, success:aws_cloudwatchlog.findLogStream, failure:failed, error:errored},
    {func:aws_cloudwatchlog.findLogStream, success:aws_cloudwatchlog.createLogEvents, failure:aws_cloudwatchlog.createLogStream, error:errored},
    {func:aws_cloudwatchlog.createLogStream, success:aws_cloudwatchlog.createLogEvents, failure:failed, error:errored},
    {func:aws_cloudwatchlog.createLogEvents, success:succeeded, failure:failed, error:errored}
  ]
  aws_cloudwatchlog.flows = flows;
  flows[0].func(input);
}
