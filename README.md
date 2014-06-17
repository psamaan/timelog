timelog
=======

a simple app for clocking in and out of a workplace or a job being done at a customer's site... etc.

Built with the MEAN stack, and made mobile with bootstrap 3.
This is ready to deploy to Heroku, and a version of it indeed is, but you can of course host it any way you like, you'll just need to change a few things to host it elsewhere, specifically the SendGrid credentials and DB URL in web.js.

Libraries and add-ons used:
---------------------------
Server:
-------

        "express": Feb app awesomeness for Node.js.
        "ejs": Server-side templating.
        "mongoose": ORM for MongoDB, used in DB schema management and easy MongoDB use.
        "passport" and "passport-local": Node.js authentication and authorization.
        "connect-flash": Server-side flash messages.
        "sendgrid": Sending emails to users (from Heroku add-on).
        "bcrypt-nodejs": Hashing and encryption of passwords.
        "password-generator": Random temporary password generation.
        
Client:
-------

        "AngularJS": Single-page super-heroic web app wizardry.
        "Bootstrap 3": Responsive grid and good utility CSS classes.
        "Font-awesome": Vector icons and fonts.
        "geo-location-javascript": Geo-location from the browser with JavaScript.
        "Lumen Bootstrap theme": Clean and pretty theme for Bootstrap 3.
        "ngQuickDate": Angular widget for a date picker.


This app is still a work in progress.

Features that will be added:
----------------------------

TODO Calculations, presentation and notifications for vacations and absence.

TODO Edit users (in addition to add which is already implemented).

TODO Admin page (to collect reports, adding and editing users... etc).

--------------Release 1 complete, app can be useful at this point -----------

TODO Manager page to approve vacations and review logs and sick days... etc.

TODO Sick Day flow.

TODO Vacation request flow.

TODO absence/neglect comment and manager review request.

TODO managers can change login/logout time on review request, shows signed and highlighted.