# Canyon Grabber: A Tool to Observe Deals 

## Installation 

Prerequisites:
- Install node

Database setup (OSX adapt as needed):
```
brew install mysql
brew services start mysql
mysql_secure_installation
```

Open `config.js` and adapt the database section to your configuration.

Create databases for 'table' and 'testTable' from `config.js`. 
As an example, if your databases are named "observation" and "test", you would:
```
mysql -u root -p
mysql> CREATE DATABASE observation;
mysql> CREATE DATABASE test;
mysql> exit
```

TODO Slack and the webhooks

Install and run:
```
npm i
npm run run
```
