# Canyon Grabber: A Tool to Observe Deals 

## Installation 

### Install NodeJS:
* OSX: `brew install node`
* Ubuntu-like: `sudo apt-get install nodejs npm`
* Raspbian (Raspbery PiB):
   * Installation via "apt-get" is too old
   * Download a package from the NodeJS website (Armv6)
   * Unpack, put into PATH
   * You may have to run `sudo apt-get update && apt-get install gcc-4.8 g++-4.8` to make it work

### Database setup:
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

If needed create an additional database user. As an example to create a "grabber" user with password "PinkiePie": 
```
mysql -u root -p
mysql> GRANT ALL PRIVILEGES ON *.* TO 'grabber'@'localhost' IDENTIFIED BY 'PinkiePie';
mysql> exit
```

Create databases for 'table' and 'testTable' from `config.js`. 
As an example, if your databases are named "observation" and "test", and your user is "grabber", you would:
```
mysql -u grabber -p
mysql> CREATE DATABASE observation;
mysql> CREATE DATABASE test;
mysql> exit
```

### TODO Slack and the webhooks

### Install and run:
```
npm i
npm run run
```


### Repeat price update regularly

One way to do it is via crontab, e.g., to grab every 5 minutes:
```
crontab -e
#Enter a line such as:
*/5 * * * * $HOME/price-grabber/bin/rungrabber.sh 1> $HOME/grabber-output.txt 2> $HOME/grabber-output.err
```
Adapt the location of `bin/rungrabber.sh` as needed. 
Choose whether you want to store script output ("1>..." and "2>...") and where you want to store it.
