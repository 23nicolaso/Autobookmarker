/*
 * Copyright 2013 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var History = {};

chrome.browserAction.setBadgeText({ 'text': '?'});
chrome.browserAction.setBadgeBackgroundColor({ 'color': "#777" });

var destFolder, bookmarkBar, finalMessage="";

chrome.bookmarks.getTree(findOrCreateDestinationFolder);

function findOrCreateDestinationFolder(rootNodes)
{
  var rootNode;
  if(rootNodes.length>0)
  {
      rootNode = rootNodes[0];
  }
  destFolder = findBookmarksFolder(rootNode, "Cache");
  if(!destFolder)
  {
      bookmarkBar = findBookmarksFolder(rootNode,"Bookmarks bar");
      chrome.bookmarks.create({parentId:bookmarkBar?bookmarkBar.id:"1",title:"Cache"}, function(bmk){
          destFolder=bmk;
          finalMessage += "Destination Folder created under Bookmarks bar.\n"
      });
  }
  else
  {
      finalMessage += "Destination Folder exists.\n"
  }
}

function findBookmarksFolder(rootNode, searchString)
{
  if(rootNode.url)
  {
      return null;
  }
  else if(rootNode.title.indexOf(searchString)>=0)
  {
      return rootNode;
  }
  for(var i=0; i<rootNode.children.length; i++)
  {
      var dest = findBookmarksFolder(rootNode.children[i], searchString);
      if(dest)
      {
          return dest;
      }
  }
  return null;
}

function addBookmark(bookmarkURL, bookmarktitle)
{
  if(destFolder)
  {
      chrome.bookmarks.create({title:bookmarktitle,parentId:destFolder.id,url:bookmarkURL});
      finalMessage += "Added bookmark.\n";
  }
  else
  {
      finalMessage += "Could not add bookmark.\n";
  }
}
function Update(t, tabId, url) {
  if (!url) {
    return;
  }
  if (tabId in History) {
    if (url == History[tabId][0][1]) {
      return;
    }
  } else {
    History[tabId] = [];
  }
  History[tabId].unshift([t, url]);

  var history_limit = parseInt(localStorage["history_size"]);
  if (! history_limit) {
    history_limit = 23;
  }
  while (History[tabId].length > history_limit) {
    History[tabId].pop();
  }

  chrome.browserAction.setBadgeText({ 'tabId': tabId, 'text': '0:00'});
  chrome.browserAction.setPopup({ 'tabId': tabId, 'popup': "popup.html#tabId=" + tabId});
}

function HandleUpdate(tabId, changeInfo, tab) {
  Update(new Date(), tabId, changeInfo.url);
}

function HandleRemove(tabId, removeInfo) {
  delete History[tabId];
}

function HandleReplace(addedTabId, removedTabId) {
  var t = new Date();
  delete History[removedTabId];
  chrome.tabs.get(addedTabId, function(tab) {
    Update(t, addedTabId, tab.url);
  });
}


function UpdateBadges() {
  var now = new Date();
  for (tabId in History) {
    var description = FormatDuration(now - History[tabId][0][0]);
    console.log(description);
    var a = localStorage["bookmark_after"];
    
    if (description==a){
      addBookmark(History[tabId][0][1],now.getDate().toString());
    }
    chrome.browserAction.setBadgeText({ 'tabId': parseInt(tabId), 'text': description});

  }
}

setInterval(UpdateBadges, 1000);

chrome.tabs.onUpdated.addListener(HandleUpdate);
chrome.tabs.onRemoved.addListener(HandleRemove);
chrome.tabs.onReplaced.addListener(HandleReplace);
