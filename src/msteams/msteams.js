"use strict";
const { IncomingWebhook } = require("ms-teams-webhook");
const ACData = require("adaptivecards-templating");
module.exports.handler = (event, context, callback) => {
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
        webhook.send(card).catch((err) => {
            if (err) {
                console.error("API--LAMBDA--MSTEAMSCONNECTOR--FAILED: " + JSON.stringify(err));
                const response = {
                    statusCode: 400,
                    body: JSON.stringify({ success: false, msg: JSON.stringify(err) }),
                };
                callback(null, response);
            }
            else {
                const response = {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, msg: "Message sent to Channel." }),
                };
                callback(null, response);
            }
        });
    }
    catch (error) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXN0ZWFtcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1zdGVhbXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE1BQU0sRUFBRSxlQUFlLEVBQUUsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUN4RCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUVuRCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxDQUFDLEtBQVUsRUFBRSxPQUFZLEVBQUUsUUFBYSxFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUU7UUFDckMsT0FBTyxDQUFDLEtBQUssQ0FBQyx3RUFBd0UsQ0FBQyxDQUFDO1FBQ3hGLFFBQVEsQ0FBQyxJQUFJLEVBQUU7WUFDYixVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRSxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUU7WUFDekMsSUFBSSxFQUFFLGlDQUFpQztTQUN4QyxDQUFDLENBQUM7UUFDSCxPQUFPO0tBQ1I7SUFDRCxJQUFJO1FBQ0YsTUFBTSxPQUFPLEdBQUcsSUFBSSxlQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNqRCxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRXhCLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUM7UUFFbkUsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FB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LElBQUksRUFBRSxxQkFBcUI7d0NBQzNCLFFBQVEsRUFBRSxJQUFJO3dDQUNkLElBQUksRUFBRSxJQUFJO3FDQUNYO2lDQUNGO2dDQUNELEtBQUssRUFBRSxTQUFTOzZCQUNqQjt5QkFDRjtxQkFDRjtvQkFDRDt3QkFDRSxJQUFJLEVBQUUsV0FBVzt3QkFDakIsSUFBSSxFQUFFLG1CQUFtQjt3QkFDekIsSUFBSSxFQUFFLElBQUk7cUJBQ1g7b0JBQ0Q7d0JBQ0UsSUFBSSxFQUFFLFNBQVM7d0JBQ2YsS0FBSyxFQUFFOzRCQUNMO2dDQUNFLEtBQUssRUFBRSxlQUFlO2dDQUN0QixLQUFLLEVBQUUsU0FBUztnQ0FDaEIsS0FBSyxFQUFFLFVBQVU7NkJBQ2xCO3lCQUNGO3FCQUNGO2lCQUNGO2dCQUNELE9BQU8sRUFBRTtvQkFDUDt3QkFDRSxJQUFJLEVBQUUsZ0JBQWdCO3dCQUN0QixLQUFLLEVBQUUsTUFBTTt3QkFDYixHQUFHLEVBQUUsWUFBWTtxQkFDbEI7aUJBQ0Y7YUFDRjtTQUNGO0tBQ0Y7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBJbmNvbWluZ1dlYmhvb2sgfSA9IHJlcXVpcmUoXCJtcy10ZWFtcy13ZWJob29rXCIpO1xyXG5jb25zdCBBQ0RhdGEgPSByZXF1aXJlKFwiYWRhcHRpdmVjYXJkcy10ZW1wbGF0aW5nXCIpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMuaGFuZGxlciA9IChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpID0+IHtcclxuICBpZiAoIXByb2Nlc3MuZW52Lk1TX1RFQU1TX1dFQkhPT0tfVVJMKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLU1TVEVBTVNDT05ORUNUT1ItLUZBSUxFRDogQmFkIHNldHVwLCBubyB3ZWJob29rIHByb3ZpZGVkLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFdlYmhvb2sgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB3ZWJob29rID0gbmV3IEluY29taW5nV2ViaG9vayhwcm9jZXNzLmVudi5NU19URUFNU19XRUJIT09LX1VSTCk7XHJcbiAgICBjb25zdCB0ZW1wbGF0ZSA9IG5ldyBBQ0RhdGEuVGVtcGxhdGUoanNvbnNjaGVtYSk7XHJcbiAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIkV2ZW50OlwiLCBldmVudC50b1N0cmluZygpKTtcclxuICAgIGNvbnN0IGFsYXJtTWVzc2FnZSA9IGV2ZW50W1wiUmVjb3Jkc1wiXVswXVtcIlNuc1wiXVtcIk1lc3NhZ2VcIl0gfHwgbnVsbDtcclxuXHJcbiAgICBjb25zdCBhbGFybV9uYW1lID0gYWxhcm1NZXNzYWdlW1wiQWxhcm1OYW1lXCJdO1xyXG4gICAgY29uc3Qgb2xkX3N0YXRlID0gYWxhcm1NZXNzYWdlW1wiT2xkU3RhdGVWYWx1ZVwiXTtcclxuICAgIGNvbnN0IG5ld19zdGF0ZSA9IGFsYXJtTWVzc2FnZVtcIk5ld1N0YXRlVmFsdWVcIl07XHJcbiAgICBjb25zdCByZWFzb24gPSBhbGFybU1lc3NhZ2VbXCJOZXdTdGF0ZVJlYXNvblwiXTtcclxuICAgIGNvbnN0IHRleHRtZXNzYWdlID0gYWxhcm1fbmFtZSArIGBoYXMgY2hhbmdlZCBmcm9tICR7b2xkX3N0YXRlfSB0byAke25ld19zdGF0ZX0gLSAke3JlYXNvbn1gO1xyXG5cclxuICAgIGxldCBjcml0aWNhbGl0eSA9IGV2ZW50LmNyaXRpY2FsaXR5IHx8IFwiVU5LTk9XTlwiO1xyXG4gICAgaWYgKG5ld19zdGF0ZS50b0xvd2VyQ2FzZSgpID09IFwiYWxhcm1cIikge1xyXG4gICAgICBjcml0aWNhbGl0eSA9IFwiSElHSFwiO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHR5cGUgPSBldmVudC50eXBlIHx8IFwiQVdTXCI7XHJcbiAgICBjb25zdCBzZXJ2aWNlbWVzc2FnZSA9IHRleHRtZXNzYWdlIHx8IGV2ZW50LnNlcnZpY2VtZXNzYWdlIHx8IFwiU2VydmljZSBNZXNzYWdlIG5vdCBwcm92aWRlZFwiO1xyXG4gICAgY29uc3Qgdmlld1VybCA9IGV2ZW50LnZpZXdVcmwgfHwgXCJodHRwczovL1wiICsgcHJvY2Vzcy5lbnYuQUNDT1VOVCArIFwiLnNpZ25pbi5hd3MuYW1hem9uLmNvbS9jb25zb2xlXCI7XHJcbiAgICBjb25zdCBwcm9wZXJ0aWVzID0gZXZlbnQucHJvcGVydGllcyB8fCBbXTtcclxuICAgIHByb3BlcnRpZXMucHVzaCh7IGtleTogXCJBY2NvdW50I1wiLCB2YWx1ZTogcHJvY2Vzcy5lbnYuQUNDT1VOVCB9KTtcclxuICAgIGNvbnN0IGNhcmQgPSB0ZW1wbGF0ZS5leHBhbmQoe1xyXG4gICAgICAkcm9vdDoge1xyXG4gICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgY3JpdGljYWxpdHk6IGNyaXRpY2FsaXR5LFxyXG4gICAgICAgIHNlcnZpY2VtZXNzYWdlOiBzZXJ2aWNlbWVzc2FnZSxcclxuICAgICAgICBkYXRldGltZTogZGF0ZS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgIHZpZXdVcmw6IHZpZXdVcmwsXHJcbiAgICAgICAgcHJvcGVydGllczogcHJvcGVydGllcyxcclxuICAgICAgICBjcmVhdG9yOiB7XHJcbiAgICAgICAgICBuYW1lOiBcIkFXUyBBbGFybXNcIixcclxuICAgICAgICAgIHByb2ZpbGVJbWFnZTogXCJodHRwczovL2F2YXRhcnMuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvNjMyMTE4NTI/dj00XCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgd2ViaG9vay5zZW5kKGNhcmQpLmNhdGNoKChlcnI6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1NU1RFQU1TQ09OTkVDVE9SLS1GQUlMRUQ6IFwiICsgSlNPTi5zdHJpbmdpZnkoZXJyKSk7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBtc2c6IEpTT04uc3RyaW5naWZ5KGVycikgfSksXHJcbiAgICAgICAgfTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIG1zZzogXCJNZXNzYWdlIHNlbnQgdG8gQ2hhbm5lbC5cIiB9KSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHZhciBib2R5ID0gSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpO1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1NU1RFQU1TQ09OTkVDVE9SLS1GQUlMRUQ6IFwiICsgSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHt9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IGpzb25zY2hlbWEgPSB7XHJcbiAgdHlwZTogXCJtZXNzYWdlXCIsXHJcbiAgYXR0YWNobWVudHM6IFtcclxuICAgIHtcclxuICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vdm5kLm1pY3Jvc29mdC5jYXJkLmFkYXB0aXZlXCIsXHJcbiAgICAgIGNvbnRlbnRVcmw6IG51bGwsXHJcbiAgICAgIGNvbnRlbnQ6IHtcclxuICAgICAgICAkc2NoZW1hOiBcImh0dHA6Ly9hZGFwdGl2ZWNhcmRzLmlvL3NjaGVtYXMvYWRhcHRpdmUtY2FyZC5qc29uXCIsXHJcbiAgICAgICAgdHlwZTogXCJBZGFwdGl2ZUNhcmRcIixcclxuICAgICAgICB2ZXJzaW9uOiBcIjEuMlwiLFxyXG4gICAgICAgIC8vIG1pbkhlaWdodDogXCI0MDBweFwiLFxyXG4gICAgICAgIHZlcnRpY2FsQ29udGVudEFsaWdubWVudDogXCJDZW50ZXJcIixcclxuICAgICAgICBib2R5OiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiVGV4dEJsb2NrXCIsXHJcbiAgICAgICAgICAgIHNpemU6IFwiTWVkaXVtXCIsXHJcbiAgICAgICAgICAgIHdlaWdodDogXCJCb2xkZXJcIixcclxuICAgICAgICAgICAgdGV4dDogXCIke3R5cGV9IFske2NyaXRpY2FsaXR5fV1cIixcclxuICAgICAgICAgICAgd3JhcDogdHJ1ZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiQ29sdW1uU2V0XCIsXHJcbiAgICAgICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIkNvbHVtblwiLFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6IFtcclxuICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSW1hZ2VcIixcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZTogXCJQZXJzb25cIixcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IFwiJHtjcmVhdG9yLnByb2ZpbGVJbWFnZX1cIixcclxuICAgICAgICAgICAgICAgICAgICBzaXplOiBcIlNtYWxsXCIsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IFwiYXV0b1wiLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJDb2x1bW5cIixcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlRleHRCbG9ja1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIHdlaWdodDogXCJCb2xkZXJcIixcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIiR7Y3JlYXRvci5uYW1lfVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHdyYXA6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlRleHRCbG9ja1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIHNwYWNpbmc6IFwiTm9uZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiQ3JlYXRlZCAke2RhdGV0aW1lfVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzU3VidGxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHdyYXA6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IFwic3RyZXRjaFwiLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiBcIlRleHRCbG9ja1wiLFxyXG4gICAgICAgICAgICB0ZXh0OiBcIiR7c2VydmljZW1lc3NhZ2V9XCIsXHJcbiAgICAgICAgICAgIHdyYXA6IHRydWUsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiBcIkZhY3RTZXRcIixcclxuICAgICAgICAgICAgZmFjdHM6IFtcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkZGF0YTogXCIke3Byb3BlcnRpZXN9XCIsXHJcbiAgICAgICAgICAgICAgICB0aXRsZTogXCIke2tleX06XCIsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogXCIke3ZhbHVlfVwiLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiBcIkFjdGlvbi5PcGVuVXJsXCIsXHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlZpZXdcIixcclxuICAgICAgICAgICAgdXJsOiBcIiR7dmlld1VybH1cIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgXSxcclxufTtcclxuIl19