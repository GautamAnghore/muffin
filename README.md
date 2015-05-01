muffin
======
__Live : http://gautamanghore.github.io/muffin/__


App to provide a solution for organizations and individuals to maintain their financial records and do quick analysis.

App is based on Backbone.js with Kinvey used for data-store (BaaS).

##How to use/Features

 - Visit the link. Click on Get Started or Login(if already registered).
 - Create an account.
 - You will be taken to the dashboard.
 - Add new expenses in new expenses box.
 - Add new incomes in new income box.
 - You will be notified when the data is successfully saved.
 - Your recent expenses and incomes will be shown in respective boxes.
 - Yearwise cash flows will be shown in a graph on the top.
 - To logout, click on username on the top right hand side and choose Logout.

##TODO

 The list of issues to fix/implement:
 
 - UI improvements
 - Add more checks on user content while signing up.
 - Add views for options in the dashboard menu(Dashboard menu options are not working).
 - Implement organizational structure
   + Different sign in option to join existing organization
   + Graph showing aggregate debit/credit per tag, per user etc.( Only for organizational admins)

##Libraries/Services Used
 
 - [Backbone.js](http://backbonejs.org/)<br/>
   Based on
   + [jquery](https://jquery.com/)
   + [underscore.js](http://underscorejs.org/)
 - Backend : [Kinvey](http://www.kinvey.com/) (Backend as a Service)
 - [Bootstrap](http://getbootstrap.com/)
 - Awesome Dashboard Theme : [AdminLTE](https://github.com/almasaeed2010/AdminLTE)
 - For graphs, D3 based library : [c3.js](http://c3js.org/)

##Note

 - Project Status : __under construction__
 - Please file issues if you find any bug or vulnerability or have any idea.