#games.push({data: "CBEIJIIECIEFLDIHKGKHJHKFLGLFMEMFCFHGBHCJDIDJGHGGFHEHFGGE", win_b: false, game: "2186188", white: "Jos Dekker", black: "Force majeure"});
#games.push({data: "MF.sDJEDDDDEJDJKIKEIJIGHKEJHEFGFCGDGGGIGCHDHFHFIEHCKBJDIALDFBFCCBEEBECFBFCGBGCHBHCIBJBICHDIDIE", win_b: true, game: "2183947", white: "Arek Kulczycki", black: "lazyplayer"});

import re
import json
import argparse
import string

computerFilter = ["gzero_bot", "mootwo", "leela_bot"]

def getCoords(pair):
    col = string.ascii_uppercase.index(pair[0])
    row = string.ascii_uppercase.index(pair[1])

    return (row, col)

def swapCoords(coords):
    row, col = coords
    return (col, row)

def extractGames(dbFile, filterNames):
    games = []
    lineNum = 0
    for line in dbFile:
        lineNum += 1
        match = re.match("games\.push\({(.*)\}\);", line)
        if match:
            jsonData = match.group(1)
            jsonData = jsonData.replace("pOmek:B", "pOmekB")
            jsonData = re.sub("((?=\D)\w+):", r'"\1":',  jsonData)
            
            data = json.loads("{" + jsonData + "}")
            moves = data["data"]
            gameId = int(data["game"])

            if len(filterNames) == 0 or data["black"] in filterNames or data["white"] in filterNames:
                games.append((extractMoves(moves), gameId))
        #else:
            #print(f"Couldn't read line {lineNum}")

    return games

def extractMoves(moveStr):
    if len(moveStr) >= 4 and moveStr[2:4] == ".s":
        swap = True
    else:
        swap = False

    moveList = []
    for i in range(0, len(moveStr), 2):
        if swap and i == 2:
            continue
        coords = getCoords(moveStr[i:i+2])
        if swap and i > 2:
            coords = swapCoords(coords)
        moveList.append(coords)

    return moveList
        
def readPattern(patternStr):
    s = patternStr
    moves = []
    while True:
        match = re.match("([a-z])([0-9]{1,2})(.*)", s)
        if match:
            col = string.ascii_lowercase.index(match.group(1))
            row = int(match.group(2)) - 1
            s = match.group(3)
            moves.append((row, col))
        else:
            break
    
    return moves

def genPatterns(pattern, size):
    patternRotated = [(size - 1 - row, size - 1 - col) for (row, col) in pattern]
    patternSwapped = [(col, row) for (row, col) in pattern]
    patternSwappedRotated = [(size - 1 - row, size - 1 - col) for (row, col) in patternSwapped]

    return (pattern, patternRotated, patternSwapped, patternSwappedRotated)


def checkPatternMatch(pattern, excludeOpp, game, whiteStartsPattern):
    (moves, gameId) = game

    movesIndex = 0
    patternIndex = 0
    while movesIndex < len(moves) and patternIndex < len(pattern):
        blackToMove = movesIndex % 2 == 0
        blackToMovePattern = ((patternIndex % 2 == 0) != whiteStartsPattern)

        if patternIndex == 0 and blackToMove == whiteStartsPattern:
            if moves[movesIndex] in excludeOpp:
                return False
        
        if blackToMove == blackToMovePattern:
            if moves[movesIndex] == pattern[patternIndex]:
                patternIndex += 1
        
        movesIndex += 1
    
    return not(patternIndex < len(pattern))

def findMatchingGames(pattern, excludeWhite, games):
    p, pr, ps, psr = genPatterns(pattern, 13)
    ew, ewr, ews, ewsr = genPatterns(excludeWhite, 13)

    matchIds = []
    for game in games:
        matched = checkPatternMatch(p, ew, game, False)
        matched = (matched or checkPatternMatch(pr, ewr, game, False))
        matched = (matched or checkPatternMatch(ps, ews, game, True))
        matched = (matched or checkPatternMatch(psr, ewsr, game, True))
        if matched:
            matchIds.append(game[1])
    return matchIds

def outputHtml(outfile, games):
    outfile.write("<head></head><body>")
    for gameId in games:
        outfile.write(f"<a href='https://www.trmph.com/hex/game/lg-{gameId}'>{gameId}</a> ")
    outfile.write("</body>")
        
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--file')
    parser.add_argument('--pattern')
    parser.add_argument('--exclude-white', default = "")
    parser.add_argument('--filter', default = "")

    args = parser.parse_args()

    pattern = readPattern(args.pattern)
    excludeWhite = readPattern(args.exclude_white)

    filterName = args.filter

    if filterName == "":
        filterNames = []
    elif filterName == "comp":
        filterNames = computerFilter
    else: 
        raise Exception("Unknown filter")
    
    
    with open(args.file, "r") as databaseFile:
        games = extractGames(databaseFile, filterNames)
        print(f"{len(games)} games successfully read")
        print(f"Game 0: {games[0]}")
        matching = findMatchingGames(pattern, excludeWhite, games)
        matching.sort()
        matchList = " ".join([str(gameId) for gameId in matching])
        print(f"Possible matches:")
        print(matchList)

        if args.exclude_white != "":
            ewPattern = f"_ew{args.exclude_white}"
        else:
            ewPattern = ""
        with open(f"foundgames_{args.pattern}{filterName}{ewPattern}.html", "w") as outfile:
            outputHtml(outfile, matching)


main()