# Canyon Grabber: A Tool to Observe Deals 

## TODO
* Introduce a config file for:
   * Database config
   * Potentially also for the urls to fetch from

## Installation 

Preqs:
- Install node

Database Stuff (OSX):
```
#Database Stuff
brew install mysql
brew services start mysql
mysql_secure_installation ##PinkiePie

#Launch SequelPro
# => create databases "canyon" and "test"
```

Install and Run:
```
npm i
npm run run
```

## Initial Research

### Get Factory Outlet items
```
curl 'https://www.canyon.com/en/factory-outlet/ajax/articles.html?category=triathlon&type=html' -XGET > /Users/saibot/Downloads/canyon2.txt 
```

### Some Parsing
```
cat /Users/saibot/Downloads/canyon2.txt | grep "\"name\"" && cat /Users/saibot/Downloads/canyon2.txt | grep "\"price\":" && cat /Users/saibot/Downloads/canyon2.txt | grep "data-size="
```