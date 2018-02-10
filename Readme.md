# Price-Grabber: A Tool to Observe Deals 

Want to observe new deals on [canyon.com](https://www.canyon.com/en/), without refreshing the site again and again?
Then this tool automates the task for you and provides you with notifications via [Slack](https://slack.com/). 

## What it is and what it is not
Current features:
* Fetch offers from the website
* Put them into a database
* Send out notifications

Architecture: This is not a service! 
Price-Grabber provides you an executable that fetches the udates and notifies you. 
Its your task to install the application, run it (repeatedly), preserve the database it uses.
Still have that old Raspbery Pi lying around? Or your media server got some capacity to spare? Or some cycles to spare on your cloud instance?
This is where you put the price grabber!
The notifications part is done via Slack, so you can read them on basically any OS or mobile device.

From here: Plan is to extend this. The database already keeps a history, so we may learn as to how prices evolve over time, and so forth.  
Only parse some portion of canyon.com? Well there are other ideas that spring to mind here. 
Want to support this? Be welcome!     

## Installation 

Dependencies:
* NodeJS to run this 
* MySQL to store information persistently
* Slack app integration called "Incoming WebHooks" to post to channels 

##### Install NodeJS:
* OSX: `brew install node`
* Ubuntu-like: `sudo apt-get install nodejs npm`
* Raspbian (Raspbery Pi B+-Model):
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

Open `config.js` and adapt the database section to your configuration.

If needed create an additional database user. 
As an example to create a "grabber" user with password "PinkiePie": 
```
mysql -u root -p
mysql> GRANT ALL PRIVILEGES ON *.* TO 'grabber'@'localhost' IDENTIFIED BY 'PinkiePie';
mysql> exit
```

Create databases for 'table' and 'testTable' from `config.js`. 
As an example, if your databases are named "canyon" and "test", and your user is "grabber", you would:
```
mysql -u grabber -p
mysql> CREATE DATABASE canyon;
mysql> CREATE DATABASE test;
mysql> exit
```

##### Slack and WebHooks
Open Slack, create a workspace if needed. 
Create the channels you would like to have, you can receive notification streams for:
* `priceUpdates`: Summarizes prices that changed (permanent offers mostly)
* `newOffers`: Lists new deals and permanent offers
* `soldOut`: Highlights deals that disappeared  
* `news`: Summary for what is put into the above thre channels
* `debug`: If something fails, Price-Grabber will try to post the error there 

Where each notification stream goes is configured in `config.js`.
A single channel can receive multiple notification streams.
If a stream is unwanted, set its WebHook to an empty string.

For each channel that should receive some notification stream, [configure a WebHook](https://get.slack.help/hc/en-us/articles/115005265063-Incoming-WebHooks-for-Slack).
Then enter the WebHook url and the channel name in `config.js`.

##### Install and run:
Install:
```
npm i
```

To make a first run:
``` 
npm run grabber
```

##### Run Repeatedly

One way to regularly repeat the search is via crontab, e.g., to grab every 5 minutes:
```
crontab -e
#In the editor that opens up, enter a line such as:
*/5 * * * * $HOME/price-grabber/bin/rungrabber.sh 1> $HOME/grabber-output.txt 2> $HOME/grabber-output.err
```
Adapt the location of `bin/rungrabber.sh` to where you checked out the sources. 
Choose whether you want to store script output ("1>..." and "2>...") and where you want to store it.

## Developers

Note that database tests use the actual mysql database! 
Configure the 'testTable' in `config.js` for that. 