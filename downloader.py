# Tasks
# x Parse current data
#    x Get list of games
#    x Get list of players
# x Read "top player list" and "good player list"
# x For each player in the "top player list"
#    x Get list of games
#    x Filter to games that are between players in the "top player list" and players that are either: 
#       x in the "top player list"
#       - in the "good player list"
#       x over 1900 rating
#    x Add to games list
# x Download NEW games from game list 
# x Parse downloaded games
# x Write out new games to DB


import urllib2
import time
import re


class Result:
    FINISHED = object()
    IN_PROGRESS = object()
    TIMEOUT = object()
    
MIN_MOVES = 5
GAME_NUM_MIN = 2055156 

def constructUrl(gamesList):
    gids = ["gid=" + str(game) for game in gamesList]
    return "http://www.littlegolem.net/jsp/game/png.jsp?" + "&".join(gids)

    



#
# Game parsing
#

def findElementRe(elem):
   reString = "{0}\[(.*?)\]".format(elem) #Elements have the format of some string followed by data in square brackets eg "PB[bob]" to specify the black player
   return re.compile(reString)

def findMoveRe():
   reString = ";[B|W]\[(.*?)\]" #Moves are always ";B[aa]" or ";W[aa]", where "aa" is the move
   return re.compile(reString)

def convertMove(move):
   if move == "swap":
      return ".s"
   elif move == "resign":
      return ""
   else:
      return move.upper()

def parseGameText(text):
    playerBlack = findElementRe("PB").search(text).group(1)
    playerWhite = findElementRe("PW").search(text).group(1)
    size = findElementRe("SZ").search(text).group(1)
    gameNumberString = findElementRe("GC").search(text).group(1)
    winnerMatch = findElementRe("RE").search(text)

    result = ""
    if winnerMatch == None:
        winnerBlack = "in progress"
        result = Result.IN_PROGRESS
    else:
        winner = winnerMatch.group(1)
        winnerBlack = "true" if winner == "B" else "false"
        result = Result.FINISHED

    gameNumber = re.search("game #([0-9]*)", gameNumberString).group(1)

    gameMoves = findMoveRe().findall(text)

    if gameMoves[-1] != "resign" and result == Result.FINISHED:
        result = Result.TIMEOUT #replace result with an enum

    gameMoveData = "".join([convertMove(m) for m in gameMoves])

    parsed = 'games.push({{data: "{0}", win_b: {1}, game: "{2}", white: "{3}", black: "{4}"}});'.format(gameMoveData, winnerBlack, gameNumber, playerWhite, playerBlack)
    
    return result, parsed, size, gameNumber

def parseResponse(data):
    findGamesRe = re.compile("\(;(.*?)\)\n") #input format is (; ... ) for each game, this finds these.

    gamesText = findGamesRe.findall(data)
    
    outputFinished = ""
    outputTimeout = ""
    outputInProgress = ""
    outputSmallGames = ""
    for game in gamesText:
        result, parsed, size, gameNumber = parseGameText(game)
        if size == "13":
            if result == Result.FINISHED:
                outputFinished += parsed + "\n"
            elif result == Result.TIMEOUT:
                outputTimeout += parsed + "\n"
            elif result == Result.IN_PROGRESS:
                outputInProgress += parsed + "\n"
        else:
            outputSmallGames += gameNumber + "\n"
            print "{0},{1}".format(size, gameNumber)
            
    
    return outputFinished, outputTimeout, outputInProgress, outputSmallGames
       




#
#database reading
#

def findDbGameRows(tableString):
   findRow = re.compile("games.push\((.*?)\);")
   
   rows = findRow.findall(tableString)
   
   return rows

def findPlayers(gameString):
   findPlayer = re.compile('(black|white): "(.*?)"')
   
   players = [found[1] for found in findPlayer.findall(gameString)]
   
   return ",".join(players)

def findGameNumber(gameString):
   findGame = re.compile('game: "(.*?)"')
   
   game = findGame.search(gameString)
   
   return game.group(1)

def findDbGameRows(tableString):
   findRow = re.compile("games.push\((.*?)\);")
   
   rows = findRow.findall(tableString)
   
   return rows

def addPlayers(gameString, playerSet):
   findPlayer = re.compile('(black|white): "(.*?)"')
   
   players = [found[1] for found in findPlayer.findall(gameString)]
   playerSet |= set(players)
   
   
def addGameNumber(gameString, gamesSet):
   findGame = re.compile('game: "(.*?)"')
   
   game = findGame.search(gameString)
   
   if game != None:
      gamesSet.add(int(game.group(1)))


def readDb(file):
    players = set()
    games = set()

    f = open(file, "r")
    data = f.read()
    f.close()
    #print "\nGame:\n".join(findDbGameRows(data))


    for game in findDbGameRows(data):
       addPlayers(game, players)
       addGameNumber(game, games)
   
    #print "\n".join(players)
    #print games
    
    return players, games

#
# player list reading
#
def readPlayerList(file):
    f = open(file, "r")
    data = f.read()
    f.close()
    
    #RE: match the player id, then the colon, then discard any whitespace, then read to the end of the line:
    findPlayer = re.compile("([0-9]+?):(?:\s*)(.*)")
    
    players = findPlayer.findall(data)
    
    playerNames = set([player[1] for player in players])
    playerIds = set([player[0] for player in players])
    
    return playerNames, playerIds


#
# Read player game list
#
def constructGameListUrl(playerId):
    #url: http://www.littlegolem.net/jsp/info/player_game_list.jsp?gtid=hex&plid=8452
    return "http://www.littlegolem.net/jsp/info/player_game_list.jsp?gtid=hex&plid={0}".format(playerId)

def findGameTable(data):
   findTable = re.compile("<table cellspacing='3' cellpadding='2' border='0' width=\"100%\">(.*?)</table>", re.DOTALL)
   
   findTableMatch = findTable.search(data)
   
   if findTableMatch == None:
      print "Table not found"
      return "Nothing found"
   else:
      return findTableMatch.group(1)


def findGameRows(tableString):
   findRow = re.compile("<tr>(.*?)</tr>", re.DOTALL)
   
   rows = findRow.findall(tableString)
   
   print("{0} rows found".format(len(rows)))

   return rows[1:] #first row is headers, discard it

def findGame(rowString):
    findGame = re.compile('<a href="/jsp/game/game.jsp\?gid=(.*?)">')
    gameInfo = findGame.search(rowString)
    gameNum = 0
    if gameInfo != None:
        gameNum = int(gameInfo.group(1))

    findPlayer = re.compile("<td bgcolor='#E9D101'>(.*?)&nbsp;</td>")
    playerInfo = findPlayer.search(rowString)
    playerString = ""
    if playerInfo == None:
        playerString = "(none)"
    else:
        playerString = playerInfo.group(1)
  
    findRating = re.compile("<td align='middle' nowrap >([0-9]*?)&nbsp;</td>")
    ratingInfo = findRating.search(rowString)
    rating = 0
    if ratingInfo != None:
        rating = int(ratingInfo.group(1))

    findMoves = re.compile("<td align='right'>([0-9]*?)&nbsp;</td>")
    movesInfo = findMoves.search(rowString)
    moves = 0
    if movesInfo != None:
        moves = int(movesInfo.group(1))
  
    findResult = re.compile('<td align=center>(.*?)&nbsp;</td>')
    resultInfo = findResult.search(rowString)
    resultString = ""
    if resultInfo == None:
        resultString = "(none)"
    else:
        resultString = resultInfo.group(1)

    #print "{} {} {} {} {}".format(gameNum, playerString, rating, resultString, moves)
 
    return gameNum, playerString, rating, resultString, moves

def filterGame(num, rating, player, result, moves, playerNames):
    if num < GAME_NUM_MIN:
        return False

    #never return unfinished games
    if result == "(none)":
        return False

    #games with few moves are to be rejected
    if moves < MIN_MOVES:
        return False

    #these players are good enough
    if rating >= 1900:
        return True

    #if they're in the list they're also good enough:
    if player in playerNames:
        return True
    
    #todo: check against good player list
    
    return False

def getPlayerGameList(playerId, playerNames):
    url = constructGameListUrl(playerId)
    print url
    
    response = urllib2.urlopen(url)
    data = response.read()
    
    games = [findGame(gameRow) for gameRow in findGameRows(findGameTable(data))]
    
    #game format is (num, player, rating, result)
    gamesFiltered = [game for game in games if filterGame(game[0], game[2], game[1], game[3], game[4], playerNames)]
    
    return gamesFiltered
    


#
# Collecting and download games:
#

def collectAllGamesToDl(topPlayersFile, dbFile):
    dbPlayers, dbGames = readDb(dbFile)
    
    topPlayerNames, topPlayerIds = readPlayerList(topPlayersFile)
    
    newGames = set()
    
    earlyBreak = 0 #0 = no early break
    for playerId in topPlayerIds:
        print "Waiting 1 second..."
        time.sleep(1)
        
        gameList = getPlayerGameList(playerId, topPlayerNames)
        print "{0} games found".format(len(gameList))
        for gameEntry in gameList:
            newGames.add(gameEntry[0]) #first part is the game number
        
        earlyBreak -= 1
        if earlyBreak == 0:
            break
    
    newGames -= dbGames
    
    print "New games ({0}):".format(len(newGames))
    return list(newGames)
    
def downloadGameList(games):
    #only download groups of 100 games at a time
    maxDownload = 100
    listFinished = ""
    listTimeout = ""
    listInProgress = ""
    for i in range(0, len(games), maxDownload):
        print "Waiting 1 second..."
        time.sleep(1)
        url = constructUrl(games[i:i + maxDownload])
        print url
        response = urllib2.urlopen(url)
        data = response.read()
        outputFinished, outputTimeout, outputInProgress, outputSmallGames = parseResponse(data)
        listFinished += outputFinished
        listTimeout += outputTimeout
        listInProgress += outputInProgress
    
    return listFinished, listTimeout, listInProgress

def writeDataToFile(data, file):
    f = open(file, 'w')
    f.write(data)
    f.close()

#downloads all games from players in the topPlayersFile that aren't currently in dbFile.
#results are divided into three categories, each of which is output to a different file.
#New, finished games are output to the outputFinishedFile
#New, timed out games (a player lost due to timeout rather than resignation) are outout to outputTimeoutFile
#New games that are still in progress are output to outputInProgressFile
def collectAndDownloadGameList(topPlayersFile, dbFile, outputFinishedFile, outputTimeoutFile, outputInProgressFile):
    outputFinished, outputTimeout, outputInProgress = downloadGameList(collectAllGamesToDl(topPlayersFile, dbFile))
    writeDataToFile(outputFinished, outputFinishedFile)
    writeDataToFile(outputTimeout, outputTimeoutFile)
    writeDataToFile(outputInProgress, outputInProgressFile)

def checkSizes(dbFile):
    players, games = readDb(dbFile)
    games = list(games)
    listSmallGames = ""
    maxDownload = 100
    for i in range(0, len(games), maxDownload):
        print "Waiting 1 second..."
        time.sleep(1)
        url = constructUrl(games[i:i + maxDownload])
        print url
        response = urllib2.urlopen(url)
        data = response.read()
        outputFinished, outputTimeout, outputInProgress, outputSmallGames = parseResponse(data)
        listSmallGames += outputSmallGames
    
    return listSmallGames

#print checkSizes("game_data.js")

collectAndDownloadGameList("top_players.txt", "game_data.js", "new_game_data.js", "timeout_game_data.js", "in_progress_game_data.js")

    

#games = [1872777, 1880699, 945815, 1678966]

#response = urllib2.urlopen(constructUrl(games))#'http://www.littlegolem.net/jsp/game/png.jsp?gid=1872777&gid=1880699')
#data = response.read()
#parseResponse(data)

#readDb("game_data.js")
#topPlayerNames, topPlayerIds = readPlayerList("top_players.txt")
#print topPlayerNames
#$print topPlayerIds

#todo: read good player list and add to topPlayerNames when calling getPlayerGameList
#gl = getPlayerGameList("1882", topPlayerNames)
#for g in gl:
#    print g

