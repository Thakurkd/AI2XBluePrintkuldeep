import urllib.request, json
url = 'https://restful-booker.herokuapp.com/apidoc/api_data.json'
data = json.loads(urllib.request.urlopen(url).read().decode('utf-8'))
with open('api_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
print("Saved api_data.json")
for d in data:
    print(f"{d.get('type')} {d.get('url')} - {d.get('name')}")
