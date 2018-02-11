class SJson {
  static isEscapeString: boolean = false;

  // Parse json string.
  public static Parse(json: string): object {
    return this.ParseValue(new Data(json));
  }

  // Whether the string value need to be escaped ?
  public static SetEscapeString(isEscapeString: boolean): void {
    SJson.isEscapeString = isEscapeString;
  }

  // Parse the JsonValue.
  private static ParseValue(data: Data): any {
    this.SkipWhiteSpace(data);

    switch (data.json[data.index]) {
      case '{':
        return this.ParseObject(data);

      case '[':
        return this.ParseArray(data);

      case '"':
        return this.ParseString(data);

      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '-':
        return this.ParseNumber(data);

      case 'f':
        if
          (
          data.json[data.index + 1] == 'a' &&
          data.json[data.index + 2] == 'l' &&
          data.json[data.index + 3] == 's' &&
          data.json[data.index + 4] == 'e'
        ) {
          data.index += 5;
          return false;
        }
        break;

      case 't':
        if
          (
          data.json[data.index + 1] == 'r' &&
          data.json[data.index + 2] == 'u' &&
          data.json[data.index + 3] == 'e'
        ) {
          data.index += 4;
          return true;
        }
        break;

      case 'n':
        if
          (
          data.json[data.index + 1] == 'u' &&
          data.json[data.index + 2] == 'l' &&
          data.json[data.index + 3] == 'l'
        ) {
          data.index += 4;
          return null;
        }
        break;
    }

    throw new Error(
      FormatString(
        "Json ParseValue error on char '{0}' index at '{1}' ",
        [ data.json[data.index], data.index ]
      )
    )
  }

  // Parse JsonObject.
  private static ParseObject(data: Data): object {
    var jsonObject = {};

    // skip '{'
    ++data.index;

    do {
      this.SkipWhiteSpace(data);

      if (data.json[data.index] == '}') {
        break;
      }

      DebugTool.Assert
        (
          data.json[data.index] == '"',
          "Json ParseObject error, char '{0}' should be '\"' ",
          [ data.json[data.index] ]
        );

      // get object key string
      var key = this.GetString(data);

      this.SkipWhiteSpace(data);

      DebugTool.Assert
        (
          data.json[data.index] == ':',
          "Json ParseObject error, after key = {0}, char '{1}' should be ':' ",
          [ key, data.json[data.index] ]
        );

      // skip ':'
      ++data.index;

      // set JsonObject key and value
      jsonObject[key] = this.ParseValue(data);

      this.SkipWhiteSpace(data);

      if (data.json[data.index] == ',') {
        ++data.index;
      }
      else {
        DebugTool.Assert
          (
            data.json[data.index] == '}',
            "Json ParseObject error, after key = {0}, char '{1}' should be '}' ",
            [ key,
            data.json[data.index] ]
          );

        break;
      }
    }
    while (true);

    // skip '}'
    ++data.index;

    return jsonObject;
  }

  // Parse JsonArray.
  private static ParseArray(data: Data): Array<any> {
    var jsonArray = [];

    // skip '['
    ++data.index;

    do {
      this.SkipWhiteSpace(data);

      if (data.json[data.index] == ']') {
        break;
      }

      // add JsonArray item 
      jsonArray.push(this.ParseValue(data));

      this.SkipWhiteSpace(data);

      if (data.json[data.index] == ',') {
        ++data.index;
      }
      else {
        DebugTool.Assert
          (
            data.json[data.index] == ']',
            "Json ParseArray error, char '{0}' should be ']' ",
            [ data.json[data.index] ]
          );
        break;
      }
    }
    while (true);

    // skip ']'
    ++data.index;

    return jsonArray;
  }

  // Parses the JsonString.
  private static ParseString(data: Data): string {
    var str: string;    

    if (SJson.isEscapeString == false) {
      str = this.GetString(data);
    }
    else {
      str = this.GetEscapedString(data);
    }

    return str;
  }

  // Parses the JsonNumber.
  private static ParseNumber(data: Data): number {
    var start = data.index;

    while (true) {
      switch (data.json[++data.index]) {
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '-':
        case '+':
        case '.':
        case 'e':
        case 'E':
          continue;
      }

      break;
    }

    var strNum = data.json.substr(start, data.index - start);
    var num: number;
    try {
      num = parseFloat(strNum);
      return num;
    } catch (error) {
      throw new Error(FormatString("Json ParseNumber error, can not parse string [{0}]", strNum));
    }
  }

  // Skip the white space.
  private static SkipWhiteSpace(data: Data): void {
    while (true) {
      switch (data.json[data.index]) {
        case ' ':
        case '\t':
        case '\n':
        case '\r':
          ++data.index;
          continue;
      }

      // index point to non-whitespace
      break;
    }
  }

  // Get the original string value includes escape char.
  private static GetString(data: Data): string {
    // skip '"'
    var start = ++data.index;

    while (true) {
      switch (data.json[data.index++]) {
        // check end '"'
        case '"':
          break;

        case '\\':
          // skip escaped quotes
          // the escape char may be '\"'，which will break while
          ++data.index;
          continue;

        default:
          continue;
      }

      break;
    }

    // index after the string end '"' so -1
    return data.json.substr(start, data.index - start - 1);
  }

  // Get the escaped string value.
  private static GetEscapedString(data: Data): string {
    // skip '"'
    var start = ++data.index;
    var str: string;

    while (true) {
      switch (data.json[data.index++]) {
        // check string end '"' 
        case '"':
          if (data.sb.length == 0) {
            // no escaped char just Substring
            str = data.json.substr(start, data.index - start - 1);
          }
          else {
            data.sb.push(data.json.substr(start, data.index - start - 1));
            str = data.sb.join('');
            // clear for next string
            data.sb.length = 0;
          }
          break;

        // check escaped char
        case '\\':
          {
            var escapedIndex = data.index;
            var c: string;

            switch (data.json[data.index++]) {
              case '"':
                c = '"';
                break;

              case '\\':
                c = '\\';
                break;

              case '/':
                c = '/';
                break;

              case '\'':
                c = '\'';
                break;

              case 'b':
                c = '\b';
                break;

              case 'f':
                c = '\f';
                break;

              case 'n':
                c = '\n';
                break;

              case 'r':
                c = '\r';
                break;

              case 't':
                c = '\t';
                break;

              case 'u':
                c = this.GetUnicodeCodePoint(data);
                break;

              default:
                // not support just add in pre string
                continue;
            }

            // add pre string and escaped char
            data.sb.push(data.json.substr(start, escapedIndex - start - 1));
            data.sb.push(c);

            // update pre string start index
            start = data.index;
            continue;
          }

        default:
          continue;
      }

      // index skipped the string end '"'
      break;
    }

    return str;
  }

  // Get the unicode code point.
  private static GetUnicodeCodePoint(data: Data): string {
    var index = data.index;

    for (var i = 0; i < 4; ++i) {
      var c = data.json[index + i];

      switch (c) {
        case '0':
          data.unicode[i] = 0;
          break;

        case '1':
          data.unicode[i] = 1;
          break;

        case '2':
          data.unicode[i] = 2;
          break;

        case '3':
          data.unicode[i] = 3;
          break;

        case '4':
          data.unicode[i] = 4;
          break;

        case '5':
          data.unicode[i] = 5;
          break;

        case '6':
          data.unicode[i] = 6;
          break;

        case '7':
          data.unicode[i] = 7;
          break;

        case '8':
          data.unicode[i] = 8;
          break;

        case '9':
          data.unicode[i] = 9;
          break;

        case 'A':
        case 'a':
          data.unicode[i] = 10;
          break;

        case 'B':
        case 'b':
          data.unicode[i] = 11;
          break;

        case 'C':
        case 'c':
          data.unicode[i] = 12;
          break;

        case 'D':
        case 'd':
          data.unicode[i] = 13;
          break;

        case 'E':
        case 'e':
          data.unicode[i] = 14;
          break;

        case 'F':
        case 'f':
          data.unicode[i] = 15;
          break;

        default:
          throw new Error(FormatString("Json Unicode char '{0}' error", [ c ]));
      }
    }

    // skip code point
    data.index += 4;

    return String.fromCharCode(
      (data.unicode[0] << 12) +
      (data.unicode[1] << 8) +
      (data.unicode[2] << 4) +
      (data.unicode[3])
    );
  }
}

class Data {
  json: string;
  index: number;
  sb: Array<string>;
  unicode: Array<number>;
  constructor(json: string) {
    this.json = json;
    this.index = 0;
    this.sb = [];
    this.unicode = [];
  }
}

function FormatString(str: string, ...val: Array<any>) {
  for (let index = 0; index < val.length; index++) {
    str = str.replace(`{${index}}`, val[index]);
  }
  return str;
}

class DebugTool {
  static Assert(condition: boolean, msg: string, ...args: Array<any>): void {
    if (condition == false) {
      throw new Error(FormatString(msg, ...args || []));
    }
  }
}

exports.default = SJson;
