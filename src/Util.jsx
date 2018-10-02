import React from 'react';

const Util = {
  decodeHtmlEntities(text) {
    let result = text;
    result = text.replace(/&lt;/g, '<');
    result = text.replace(/&gt;/g, '>');
    result = text.replace(/&quot;/g, '"');
    result = text.replace(/&amp;/g, '&');
    return result;
  },

  nl2br(text) {
    const result = text.split('\n').map(function(item, key) { return (
      <span key={key}>
        {item}
        <br />
      </span>
    )});
    return result;
  },

  // This function does: nl2br, convert urls to a-tags and display citations
  // (anything that starts with >) using gray color
  urls2links(text) {
    const result = text.split('\n').map((item, key) => {
      const itemAr = [];
      let textStart = 0;
      while (true) {
        let pos1 = item.indexOf('http://', textStart);
        if (pos1 === -1) pos1 = item.indexOf('https://');
        if (pos1 === -1) {
          itemAr.push(item.substr(textStart, item.length));
          break;
        }
        textStart = item.indexOf(' ', pos1);
        if (textStart === -1) textStart = item.length;
        const url = item.substr(pos1, textStart);

        itemAr.push(item.substr(textStart, pos1));
        itemAr.push(<a href={url} target="_blank">{url}</a>);
      }

      var textColor = (item[0] === '>') ? 'gray' : 'black';

      return (
        <span key={key} style={{ color: textColor }}>
          {itemAr}
          <br />
        </span>
      );
    });
    return result;
  },

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  zeroPad(str, len) {
    let result = `${str}`;
    while (result.length < len) result = `0${result}`;
    return result;
  },
};

export default Util;
