import { Meteor } from "meteor/meteor";

declare var ServiceConfiguration:any;
let fbApp = Meteor.settings.public["fbApp"];

ServiceConfiguration.configurations.remove({
    service: 'facebook'
});
ServiceConfiguration.configurations.insert({
    service: 'facebook',
    appId: fbApp.appId,
    display: 'popup',
    secret: fbApp.secret
});
