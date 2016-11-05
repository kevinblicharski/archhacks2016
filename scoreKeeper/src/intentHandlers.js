/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var textHelper = require('./textHelper'),
    storage = require('./storage');

var currentMedName = 'noooooo';
var currentMedDosage = '2';
var currentMedDuration = '5 days';

var registerIntentHandlers = function (intentHandlers, skillContext) {
    intentHandlers.NewMedIntent = function (intent, session, response) {
      //add a player to the current game,
      //terminate or continue the conversation based on whether the intent
      //is from a one shot command or not.
      currentMedName = textHelper.getMedName(intent.slots.Medication.value);
      storage.loadMedList(session, function (medListData) {
          var speechOutput,
              reprompt;
          if (intent.slots.Dosage.value != null)
          {
            currentMedDosage = intent.slots.Dosage.value;
            if (intent.slots.Duration.value != null)
            {
              currentMedDuration = intent.slots.Duration.value;
              var date = textHelper.getDate();
              for (var i = 0; i < currentMedDuration; ++i)
              {

              }
              var key = currentMedName + ';' + currentMedDuration;
              var value = currentMedDosage + ';not taken';
              medListData.data.medications.push(currentMedName);
              medListData.data.usages[currentMedName] = value;
              speechOutput = currentMedDosage + ' of ' + currentMedName + ' added for '
                + currentMedDuration;
            }
            else
            {
              speechOutput = 'How long will you be taking ' + currentMedName + '?';
              reprompt = 'How long will you be taking ' + currentMedName + '?';
            }
          }
          else
          {
            speechOutput = 'How much ' + currentMedName + ' will you be taking?';
            reprompt = 'How much ' + currentMedName + ' will you be taking?';
          }
          medListData.save(function () {
              if (reprompt) {
                  response.ask(speechOutput, reprompt);
              } else {
                  response.tell(speechOutput);
              }
          });
      });
    };

    intentHandlers.DeleteMedIntent = function (intent, session, response) {

    };

    intentHandlers.GetMedsIntent = function (intent, session, response) {
        var speechOutput = 'Today you need to take the following medications: ';
        var currentDate = textHelper.formatDate(new Date());
        medListData.data.medications.forEach(function (med)
          var parsedKey = textHelper.parseMedKey(med);
          if (parsedKey[1] === currentDate)
          {
            var todayMed = textHelper.parseMedValue(medListData.data.scores[med]);
            if (todayMed.length == 1 || todayMed[1] = "not taken")
            {
              speechOutput += todayMed[0] + " of " + parsedKey + ", ";
            }
          }
        )
        response.tell(speechOutput);
    };

    intentHandlers.MedTakenEvent = function (intent, session, response) {

    };

    intentHandlers.NewGameIntent = function (intent, session, response) {
        //reset scores for all existing players
        storage.loadMedList(session, function (medListData) {
            if (medListData.data.players.length === 0) {
                response.ask('New game started. Who\'s your first player?',
                    'Please tell me who\'s your first player?');
                return;
            }
            medListData.data.players.forEach(function (player) {
                medListData.data.scores[player] = 0;
            });
            medListData.save(function () {
                var speechOutput = 'New game started with '
                    + medListData.data.players.length + ' existing player';
                if (medListData.data.players.length > 1) {
                    speechOutput += 's';
                }
                speechOutput += '.';
                if (skillContext.needMoreHelp) {
                    speechOutput += '. You can give a player points, add another player, reset all players or exit. What would you like?';
                    var repromptText = 'You can give a player points, add another player, reset all players or exit. What would you like?';
                    response.ask(speechOutput, repromptText);
                } else {
                    response.tell(speechOutput);
                }
            });
        });
    };

    intentHandlers.AddPlayerIntent = function (intent, session, response) {
        //add a player to the current game,
        //terminate or continue the conversation based on whether the intent
        //is from a one shot command or not.
        var newPlayerName = textHelper.getMedName(intent.slots.PlayerName.value);
        if (!newPlayerName) {
            response.ask('OK. Who do you want to add?', 'Who do you want to add?');
            return;
        }
        storage.loadMedList(session, function (medListData) {
            var speechOutput,
                reprompt;
            if (medListData.data.scores[newPlayerName] !== undefined) {
                speechOutput = newPlayerName + ' has already joined the game.';
                if (skillContext.needMoreHelp) {
                    response.ask(speechOutput + ' What else?', 'What else?');
                } else {
                    response.tell(speechOutput);
                }
                return;
            }
            speechOutput = newPlayerName + ' has joined your game. ';
            medListData.data.players.push(newPlayerName);
            medListData.data.scores[newPlayerName] = 0;
            if (skillContext.needMoreHelp) {
                if (medListData.data.players.length == 1) {
                    speechOutput += 'You can say, I am Done Adding Players. Now who\'s your next player?';
                    reprompt = textHelper.nextHelp;
                } else {
                    speechOutput += 'Who is your next player?';
                    reprompt = textHelper.nextHelp;
                }
            }
            medListData.save(function () {
                if (reprompt) {
                    response.ask(speechOutput, reprompt);
                } else {
                    response.tell(speechOutput);
                }
            });
        });
    };

    intentHandlers.AddScoreIntent = function (intent, session, response) {
        //give a player points, ask additional question if slot values are missing.
        var playerName = textHelper.getMedName(intent.slots.PlayerName.value),
            score = intent.slots.ScoreNumber,
            scoreValue;
        if (!playerName) {
            response.ask('sorry, I did not hear the player name, please say that again', 'Please say the name again');
            return;
        }
        scoreValue = parseInt(score.value);
        if (isNaN(scoreValue)) {
            console.log('Invalid score value = ' + score.value);
            response.ask('sorry, I did not hear the points, please say that again', 'please say the points again');
            return;
        }
        storage.loadMedList(session, function (medListData) {
            var targetPlayer, speechOutput = '', newScore;
            if (medListData.data.players.length < 1) {
                response.ask('sorry, no player has joined the game yet, what can I do for you?', 'what can I do for you?');
                return;
            }
            for (var i = 0; i < medListData.data.players.length; i++) {
                if (medListData.data.players[i] === playerName) {
                    targetPlayer = medListData.data.players[i];
                    break;
                }
            }
            if (!targetPlayer) {
                response.ask('Sorry, ' + playerName + ' has not joined the game. What else?', playerName + ' has not joined the game. What else?');
                return;
            }
            newScore = medListData.data.scores[targetPlayer] + scoreValue;
            medListData.data.scores[targetPlayer] = newScore;

            speechOutput += scoreValue + ' for ' + targetPlayer + '. ';
            if (medListData.data.players.length == 1 || medListData.data.players.length > 3) {
                speechOutput += targetPlayer + ' has ' + newScore + ' in total.';
            } else {
                speechOutput += 'That\'s ';
                medListData.data.players.forEach(function (player, index) {
                    if (index === medListData.data.players.length - 1) {
                        speechOutput += 'And ';
                    }
                    speechOutput += player + ', ' + medListData.data.scores[player];
                    speechOutput += ', ';
                });
            }
            medListData.save(function () {
                response.tell(speechOutput);
            });
        });
    };

    intentHandlers.TellScoresIntent = function (intent, session, response) {
        //tells the scores in the leaderboard and send the result in card.
        storage.loadMedList(session, function (medListData) {
            var sortedPlayerScores = [],
                continueSession,
                speechOutput = '',
                leaderboard = '';
            if (medListData.data.players.length === 0) {
                response.tell('Nobody has joined the game.');
                return;
            }
            medListData.data.players.forEach(function (player) {
                sortedPlayerScores.push({
                    score: medListData.data.scores[player],
                    player: player
                });
            });
            sortedPlayerScores.sort(function (p1, p2) {
                return p2.score - p1.score;
            });
            sortedPlayerScores.forEach(function (playerScore, index) {
                if (index === 0) {
                    speechOutput += playerScore.player + ' has ' + playerScore.score + 'point';
                    if (playerScore.score > 1) {
                        speechOutput += 's';
                    }
                } else if (index === sortedPlayerScores.length - 1) {
                    speechOutput += 'And ' + playerScore.player + ' has ' + playerScore.score;
                } else {
                    speechOutput += playerScore.player + ', ' + playerScore.score;
                }
                speechOutput += '. ';
                leaderboard += 'No.' + (index + 1) + ' - ' + playerScore.player + ' : ' + playerScore.score + '\n';
            });
            response.tellWithCard(speechOutput, "Leaderboard", leaderboard);
        });
    };

    intentHandlers.ResetPlayersIntent = function (intent, session, response) {
        //remove all players
        storage.newGame(session).save(function () {
            response.ask('New game started without players, who do you want to add first?', 'Who do you want to add first?');
        });
    };

    intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
        var speechOutput = textHelper.completeHelp;
        if (skillContext.needMoreHelp) {
            response.ask(textHelper.completeHelp + ' So, how can I help?', 'How can I help?');
        } else {
            response.tell(textHelper.completeHelp);
        }
    };

    intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can start giving points to the players in your game.');
        } else {
            response.tell('');
        }
    };

    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can start giving points to the players in your game.');
        } else {
            response.tell('');
        }
    };
};
exports.register = registerIntentHandlers;
