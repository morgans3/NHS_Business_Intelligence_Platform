const { IncomingWebhook } = require("ms-teams-webhook");
const ACData = require("adaptivecards-templating");

module.exports.handler = (event: any, context: any, callback: any) => {
  if (!process.env.MS_TEAMS_WEBHOOK_URL) {
    console.error("API--LAMBDA--MSTEAMSCONNECTOR--FAILED: Bad setup, no webhook provided.");
    callback(null, {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "Bad Request. Webhook not found.",
    });
    return;
  }
  try {
    const webhook = new IncomingWebhook(process.env.MS_TEAMS_WEBHOOK_URL);
    const template = new ACData.Template(jsonschema);
    const date = new Date();

    console.log("Event:", event.toString());
    const alarmMessage = event["Records"][0]["Sns"]["Message"] || null;

    const alarm_name = alarmMessage["AlarmName"];
    const old_state = alarmMessage["OldStateValue"];
    const new_state = alarmMessage["NewStateValue"];
    const reason = alarmMessage["NewStateReason"];
    const textmessage = alarm_name + `has changed from ${old_state} to ${new_state} - ${reason}`;

    let criticality = event.criticality || "UNKNOWN";
    if (new_state.toLowerCase() == "alarm") {
      criticality = "HIGH";
    }

    const type = event.type || "AWS";
    const servicemessage = textmessage || event.servicemessage || "Service Message not provided";
    const viewUrl = event.viewUrl || "https://" + process.env.ACCOUNT + ".signin.aws.amazon.com/console";
    const properties = event.properties || [];
    properties.push({ key: "Account#", value: process.env.ACCOUNT });
    const card = template.expand({
      $root: {
        type: type,
        criticality: criticality,
        servicemessage: servicemessage,
        datetime: date.toISOString(),
        viewUrl: viewUrl,
        properties: properties,
        creator: {
          name: "AWS Alarms",
          profileImage: "https://avatars.githubusercontent.com/u/63211852?v=4",
        },
      },
    });
    webhook.send(card).catch((err: any) => {
      if (err) {
        console.error("API--LAMBDA--MSTEAMSCONNECTOR--FAILED: " + JSON.stringify(err));
        const response = {
          statusCode: 400,
          body: JSON.stringify({ success: false, msg: JSON.stringify(err) }),
        };
        callback(null, response);
      } else {
        const response = {
          statusCode: 200,
          body: JSON.stringify({ success: true, msg: "Message sent to Channel." }),
        };
        callback(null, response);
      }
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--MSTEAMSCONNECTOR--FAILED: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: {},
      body: JSON.stringify(body),
    });
  }
};

const jsonschema = {
  type: "message",
  attachments: [
    {
      contentType: "application/vnd.microsoft.card.adaptive",
      contentUrl: null,
      content: {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.2",
        // minHeight: "400px",
        verticalContentAlignment: "Center",
        body: [
          {
            type: "TextBlock",
            size: "Medium",
            weight: "Bolder",
            text: "${type} [${criticality}]",
            wrap: true,
          },
          {
            type: "ColumnSet",
            columns: [
              {
                type: "Column",
                items: [
                  {
                    type: "Image",
                    style: "Person",
                    url: "${creator.profileImage}",
                    size: "Small",
                  },
                ],
                width: "auto",
              },
              {
                type: "Column",
                items: [
                  {
                    type: "TextBlock",
                    weight: "Bolder",
                    text: "${creator.name}",
                    wrap: true,
                  },
                  {
                    type: "TextBlock",
                    spacing: "None",
                    text: "Created ${datetime}",
                    isSubtle: true,
                    wrap: true,
                  },
                ],
                width: "stretch",
              },
            ],
          },
          {
            type: "TextBlock",
            text: "${servicemessage}",
            wrap: true,
          },
          {
            type: "FactSet",
            facts: [
              {
                $data: "${properties}",
                title: "${key}:",
                value: "${value}",
              },
            ],
          },
        ],
        actions: [
          {
            type: "Action.OpenUrl",
            title: "View",
            url: "${viewUrl}",
          },
        ],
      },
    },
  ],
};
