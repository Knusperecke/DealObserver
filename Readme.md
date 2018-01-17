Research:

Get Factory Outlet items:

curl 'https://www.canyon.com/en/factory-outlet/ajax/articles.html?category=triathlon&type=html' -XGET > /Users/saibot/Downloads/canyon2.txt 

Some Parsing:

cat /Users/saibot/Downloads/canyon2.txt | grep "\"name\"" && cat /Users/saibot/Downloads/canyon2.txt | grep "\"price\":" && cat /Users/saibot/Downloads/canyon2.txt | grep "data-size="
