// @ts-check

const { IncomingWebhook } = require("ms-teams-webhook");
const ACData = require("adaptivecards-templating");
// Read a url from the environment variables
const url = process.env.MS_TEAMS_WEBHOOK_URL || "https://nhs.webhook.office.com/webhookb2/3ea40dc5-9916-427c-93fc-480765d67222@37c354b2-85b0-47f5-b222-07b48d774ee3/IncomingWebhook/27add197921441f7ba160e7044ea87c9/1cb487ac-692c-488f-9280-2ec46e31c0ea";

// Initialize
const webhook = new IncomingWebhook(url);

(async () => {
  const date = new Date();
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
  var template = new ACData.Template(jsonschema);

  const card = template.expand({
    $root: {
      type: "Lambda",
      criticality: "HIGH",
      servicemessage: "testlambdaservice has failed to complete a task",
      datetime: date.toISOString(),
      viewUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      properties: [
        {
          key: "TagOne_Key",
          value: "TagOne_Value",
        },
      ],
      creator: {
        name: "Cloudwatch Alarms",
        profileImage: "https://avatars.githubusercontent.com/u/63211852?v=4",
      },
    },
  });

  await webhook.send(card).catch((err) => {
    console.log(err);
  });
})();
