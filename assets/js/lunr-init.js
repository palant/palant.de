(function initLunr()
{
  var index = null;
  var lookup = null;
  var queuedTerm = null;

  document.getElementById("search").addEventListener("submit", function(event)
  {
    event.preventDefault();

    var term = document.getElementById("search-textbox").value.trim();
    if (!term)
      return;

    if (index)
      search(term);
    else if (queuedTerm)
      queuedTerm = term;
    else
    {
      queuedTerm = term;
      initIndex();
    }
  }, false);

  function initIndex()
  {
    var request = new XMLHttpRequest();
    request.open("GET", "/index.json");
    request.addEventListener("load", function(event)
    {
      var documents = JSON.parse(request.responseText);
      lookup = {};
      index = lunr(function()
      {
        this.ref("uri");
        this.field("title");
        this.field("description");
        this.field("categories");
        this.field("content");

        for (var i = 0; i < documents.length; i++)
        {
          this.add(documents[i]);
          lookup[documents[i].uri] = documents[i];
        }
      });

      search(queuedTerm);
    }, false);
    request.send(null);
  }

  function search(term)
  {
    var results = index.search(term);

    var target = document.getElementById("main");
    while (target.firstChild)
      target.removeChild(target.firstChild);

    var title = document.createElement("h1");
    title.textContent = "Search results for " + term + ":";
    target.appendChild(title);

    if (results.length)
    {
      for (let i = 0; i < results.length; i++)
      {
        var doc = lookup[results[i].ref];

        var par = document.createElement("p");
        par.appendChild(document.createTextNode((i + 1) + ". "));

        var link = document.createElement("a");
        link.href = doc.uri;
        link.textContent = doc.title;
        par.appendChild(link);

        target.appendChild(par);

        var par = document.createElement("p");
        par.textContent = truncateToEndOfSentence(doc.content, 70);
        target.appendChild(par);
      }
    }
    else
    {
      var par = document.createElement("p");
      var text = document.createElement("strong");
      text.textContent = "No results found.";
      par.appendChild(text);
      target.appendChild(par);
    }
  }

  // This matches Hugo's own summary logic:
  // https://github.com/gohugoio/hugo/blob/b5f39d23b86f9cb83c51da9fe4abb4c19c01c3b7/helpers/content.go#L543
  function truncateToEndOfSentence(text, minWords)
  {
    var match;
    var result = "";
    var wordCount = 0;
    var regexp = /(\S+)(\s*)/g;
    while (match = regexp.exec(text))
    {
      wordCount++;
      if (wordCount <= minWords)
        result += match[0];
      else
      {
        var char1 = match[1][match[1].length - 1];
        var char2 = match[2][0];
        if (/[.?!"]/.test(char1) || char2 == "\n")
        {
          result += match[1];
          break;
        }
        else
          result += match[0];
      }
    }
    return result;
  }
})();