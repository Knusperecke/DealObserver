# Deal Observer: A Tool to Observe Deals 

Want to observe new deals on [canyon.com](https://www.canyon.com/en/), 
without refreshing the site again and again?
Then this tool automates the task for you and provides you with notifications via [Slack](https://slack.com/). 

## You are Here!
Current features:
* Fetch offers from the website
* Put them into a database
* Send out notifications

This is not a service! 
The project provides you an executable that fetches updates and notifies you. 
Its your task to install it, run it (repeatedly), and to preserve its database.
Still have that old Raspberry Pi lying around? Or your media server got some capacity to spare? Or some cycles to spare on your cloud instance?
This is where you put the deal observer!
The notifications part utilizes Slack, so you can read them on basically any OS or mobile device.

From here: Plan is to extend this. The database already keeps a history, so we may learn as to how prices evolve over time, and so forth.  
If you look for a specific deal, you probably want filtering capabilities to only see what relates to that.
Only parse some portion of canyon.com? Well there are other ideas that spring to mind here. 
Want to support this? Be welcome, there is a developers section at the end.  

## Installation 

Dependencies:
* NodeJS to run this 
* MySQL to store information persistently
* Slack app integration called "Incoming WebHooks" to post to channels 

##### Install NodeJS:
* OSX: `brew install node yarn`
* Ubuntu-like: `sudo apt-get install nodejs npm`
* Raspbian (Raspbery Pi2 B+-Model):
   * Installation via "apt-get" is outdated
   * Download recent package from NodeJS website (Armv6)
   * Unpack, put into PATH
   * You may have to run `sudo apt-get update && apt-get install gcc-4.8 g++-4.8` to make it work

##### Database setup:
* OSX:
```
brew install mysql
brew services start mysql
mysql_secure_installation
```
* Ubuntu-like:
```
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

Open `config.js` and adapt the database section to your match what you did in `mysql_secure_installation`.

If needed, create an additional database user. 
As an example to create a "canyon" user with password "PinkiePie": 
```
mysql -u root -p
mysql> CREATE USER 'canyon'@'localhost' IDENTIFIED BY 'PinkiePie';
mysql> GRANT ALL PRIVILEGES ON *.* TO 'canyon'@'localhost'; 
mysql> exit
```

Create databases for 'table' and 'testTable' from `config.js`. 
As an example, if your databases are named "canyon" and "test", and your user is "canyon", you would:
```
mysql -u canyon -p
mysql> CREATE DATABASE canyon;
mysql> CREATE DATABASE test;
mysql> exit
```

##### Slack and WebHooks
Open Slack, create a workspace if needed. 
Create the channels you would like to have, you can receive notification streams for:
* `priceUpdates`: Summarizes prices that changed (permanent offers mostly),
* `newOffers`: Lists new deals and permanent offers,
* `soldOut`: Highlights deals that disappeared,
* `news`: Summary for what is put into the above three channels, and
* `debug`: If something fails, deal observer will try to post the error there. 

Where each notification stream goes, is configured in `config.js`.
A single channel can receive multiple notification streams.
If a stream is unwanted, set its WebHook to an empty string.

For each channel that should receive some notification stream, [configure a WebHook](https://get.slack.help/hc/en-us/articles/115005265063-Incoming-WebHooks-for-Slack).
Then enter the WebHook url and the channel name in `config.js`.

##### Install and run:
Install:
```
yarn
```

To make a first run (Do not notify about each deal it finds):
``` 
yarn grabber-initial
```

To notify about each change in available items or prices, all subsequent runs would then use:
``` 
npm run grabber
```

##### Run Repeatedly

One way to regularly repeat the search is via crontab, e.g., to grab every 5 minutes:
```
crontab -e
#In the editor that opens up, enter a line such as:
*/5 * * * * $HOME/deal-observer/bin/rungrabber.sh 1> $HOME/grabber-output.txt 2> $HOME/grabber-output.err
```
Adapt the location of `bin/rungrabber.sh` to where you checked out the sources. 
Choose whether you want to store script output ("1>..." and "2>...") and where you want to store it.

## Developers

Note that database tests use the actual mysql database! 
So you have to configure the "testTable" in `config.js` for that.
Currently all dependencies are installed, feel free to sort out dev dependencies if you like.

To contribute, you would:
- Create your branch,
- Make your changes,
- Run `npm test` to see that your contributions work and hopefully improve test coverage,
- Run `npm run lint` to ensure no obvious errors are present,
- Run `npm format` to get things into a somewhat common shape, and then
- Commit, push, and so forth.

Happy programming!   