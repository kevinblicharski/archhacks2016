/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
        http://aws.amazon.com/apache2.0/
    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var textHelper = require('./textHelper'),
    storage = require('./storage');

var currentMedName;
var currentMedDosage;
var currentMedDuration;
var currentMedFrequency;

var registerIntentHandlers = function (intentHandlers, skillContext) {
    intentHandlers.NewMedIntent = function (intent, session, response) {
      //add a player to the current game,
      //terminate or continue the conversation based on whether the intent
      //is from a one shot command or not.
      currentMedName = intent.slots.Medication.value;
      storage.loadMedList(session, function (medList) {
          var speechOutput,
              reprompt;
          if (intent.slots.Dosage.value != null)
          {
            currentMedDosage = intent.slots.Dosage.value;
            if (intent.slots.Frequency.value != null)
            {
              currentMedFrequency = intent.slots.Frequency.value;
              if (intent.slots.Duration.value != null)
              {
                currentMedDuration = intent.slots.Duration.value;
                var date = new Date();
                for (var i = 0; i < currentMedDuration.split(' ')[0]; ++i)
                {
                  var key = currentMedName + ';' + textHelper.formatDate(date) + ';'
                    + currentMedFrequency;
                  var value = currentMedDosage + ';not taken';
                  medList.data.medications.push(key);
                  medList.data.dosages[key] = value;
                  date.setDate(date.getDate() + 1);
                }
                speechOutput = currentMedDosage + ' of ' + currentMedName + ' added for '
                  + currentMedDuration + '.';
              }
              else
              {
                speechOutput = 'How long will you be taking ' + currentMedName + '?';
                reprompt = 'How long will you be taking ' + currentMedName + '?';
              }
            }
            else
            {
              speechOutput = 'How often will you be taking ' + currentMedName + '?';
              reprompt = 'How often will you be taking  ' + currentMedName + '?';
            }
          }
          else
          {
            speechOutput = 'How much ' + currentMedName + ' will you be taking?';
            reprompt = 'How much ' + currentMedName + ' will you be taking?';
          }
          medList.save(function () {
              if (reprompt) {
                  response.ask(speechOutput, reprompt);
              } else {
                  response.tell(speechOutput);
              }
          });
      });
    };

    intentHandlers.GetDosageIntent = function (intent, session, response) {
      //add a player to the current game,
      //terminate or continue the conversation based on whether the intent
      //is from a one shot command or not.
      storage.loadMedList(session, function (medList) {
          var speechOutput,
              reprompt;
          currentMedDosage = intent.slots.Dosage.value;
          speechOutput = 'How often will you be taking ' + currentMedName + '?';
          reprompt = 'How often will you be taking ' + currentMedName + '?';
          medList.save(function () {
              response.ask(speechOutput, reprompt);
          });
      });
    };

    /*
    medList.data.medications --> all the keys in the form "medName;yyyy-mm-dd"
      Example: "Tylenol;2016-11-05"
    medList.data.dosages[key] --> the value for the key in the form "dosageAmount;taken/not taken"
      Example: "3 mg;not taken"
    probably want to add something to the key, i.e. "medName;yyyy-mm-dd;frequencyTag"
    */
    intentHandlers.GetFrequencyIntent = function (intent, session, response) {
      storage.loadMedList(session, function (medList) {
        var speechOutput, reprompt;

        currentMedFrequency = intent.slots.Frequency.value;

        speechOutput = 'How long will you be taking ' + currentMedName + '?';
        reprompt = 'How long will you be taking ' + currentMedName + '?';

        medList.save(function () {
          response.ask(speechOutput, reprompt);
        });

      });
    };

    intentHandlers.GetDurationIntent = function (intent, session, response) {
      //add a player to the current game,
      //terminate or continue the conversation based on whether the intent
      //is from a one shot command or not.
      storage.loadMedList(session, function (medList) {
          var speechOutput, frequencyArray;
          var frequency = 1;

          currentMedDuration = intent.slots.Duration.value;
          var date = new Date();
          
          if(currentMedFrequency === "daily"){
            frequency = 1;
          }
          else if(currentMedFrequency === "every other day"){
            frequency = 2;
          }
          else{
            frequencyArray = currentMedFrequency.split(' ');

            for(var i=0; i<frequencyArray.length; i++){

              if(frequencyArray[i] === parseInt(frequencyArray[i], 10)){
                frequency = frequencyArray[i];
              }

              if(frequencyArray[i] === "week" || frequencyArray[i] === "weeks"){
                frequency *= 7;
              }

              if(frequencyArray[i] === "month" || frequencyArray[i] === "months"){
                frequency *= 30;
              }
            }
          }

          for (var i = 0; i < currentMedDuration.split(' ')[0]; i += frequency)
          {
            var key = currentMedName + ';' + textHelper.formatDate(date) + ';'
              + currentMedFrequency;
            var value = currentMedDosage + ';not taken';
            medList.data.medications.push(key);
            medList.data.dosages[key] = value;

            date.setDate(date.getDate() + frequency);
          }
          speechOutput = currentMedDosage + ' of ' + currentMedName + ' added for '
            + currentMedDuration + '.';
          medList.save(function () {
              response.tell(speechOutput);
          });
      });
    };

    intentHandlers.GetMedsIntent = function (intent, session, response) {
        storage.loadMedList(session, function (medList) {
            var medListCopy = [],
                speechOutput = 'You need to take the following today. ';
            if (medList.data.medications.length === 0) {
                response.tell('You have no medications to take today.');
                return;
            }
            medList.data.medications.forEach(function (med) {
                medListCopy.push({
                    dosage: medList.data.dosages[med],
                    name: med
                });
            });
            var currentDate = textHelper.formatDate(new Date());
            medListCopy.forEach(function (med)
            {
              var parsedKey = med.name.split(';');
              if (parsedKey[1] === currentDate)
              {
                var todayMed = med.dosage.split(';');
                if (todayMed.length == 1 || todayMed[1] == 'not taken')
                {
                  speechOutput += (todayMed[0] + ' of ' + parsedKey[0] + '. ');
                }
              }
            });
            response.tell(speechOutput);
        });
    };

    intentHandlers.SendEmailIntent = function (intent, session, response) {
      storage.loadMedList(session, function (medList) {
        // email shit goes Here

      });
    };

    intentHandlers.NewGameIntent = function (intent, session, response) {
        //reset scores for all existing players
        storage.loadMedList(session, function (medList) {
            if (medList.data.medications.length === 0) {
                response.ask('New game started. Who\'s your first player?',
                    'Please tell me who\'s your first player?');
                return;
            }
            medList.data.medications.forEach(function (med) {
                medList.data.dosages[med] = 0;
            });
            medList.save(function () {
                var speechOutput = 'New game started with '
                    + medList.data.medications.length + ' existing player';
                if (medList.data.medications.length > 1) {
                    speechOutput += 's';
                }
                speechOutput += '.';
                if (skillContext.needMoreHelp) {
                    speechOutput += '. You can give a player points, add another player, reset all medications or exit. What would you like?';
                    var repromptText = 'You can give a player points, add another player, reset all medications or exit. What would you like?';
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
        var newPlayerName = textHelper.getPlayerName(intent.slots.Medication.value);
        if (!newPlayerName) {
            response.ask('OK. Who do you want to add?', 'Who do you want to add?');
            return;
        }
        storage.loadMedList(session, function (medList) {
            var speechOutput,
                reprompt;
            if (medList.data.dosages[newPlayerName] !== undefined) {
                speechOutput = newPlayerName + ' has already joined the game.';
                if (skillContext.needMoreHelp) {
                    response.ask(speechOutput + ' What else?', 'What else?');
                } else {
                    response.tell(speechOutput);
                }
                return;
            }
            speechOutput = newPlayerName + ' has joined your game. ';
            medList.data.medications.push(newPlayerName);
            medList.data.dosages[newPlayerName] = 0;
            if (skillContext.needMoreHelp) {
                if (medList.data.medications.length == 1) {
                    speechOutput += 'You can say, I am Done Adding Medications. Now who\'s your next player?';
                    reprompt = textHelper.nextHelp;
                } else {
                    speechOutput += 'Who is your next player?';
                    reprompt = textHelper.nextHelp;
                }
            }
            medList.save(function () {
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
        var playerName = textHelper.getPlayerName(intent.slots.Medication.value),
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
        storage.loadMedList(session, function (medList) {
            var targetPlayer, speechOutput = '', newScore;
            if (medList.data.medications.length < 1) {
                response.ask('sorry, no player has joined the game yet, what can I do for you?', 'what can I do for you?');
                return;
            }
            for (var i = 0; i < medList.data.medications.length; i++) {
                if (medList.data.medications[i] === playerName) {
                    targetPlayer = medList.data.medications[i];
                    break;
                }
            }
            if (!targetPlayer) {
                response.ask('Sorry, ' + playerName + ' has not joined the game. What else?', playerName + ' has not joined the game. What else?');
                return;
            }
            newScore = medList.data.dosages[targetPlayer] + scoreValue;
            medList.data.dosages[targetPlayer] = newScore;

            speechOutput += scoreValue + ' for ' + targetPlayer + '. ';
            if (medList.data.medications.length == 1 || medList.data.medications.length > 3) {
                speechOutput += targetPlayer + ' has ' + newScore + ' in total.';
            } else {
                speechOutput += 'That\'s ';
                medList.data.medications.forEach(function (player, index) {
                    if (index === medList.data.medications.length - 1) {
                        speechOutput += 'And ';
                    }
                    speechOutput += player + ', ' + medList.data.dosages[player];
                    speechOutput += ', ';
                });
            }
            medList.save(function () {
                response.tell(speechOutput);
            });
        });
    };

    intentHandlers.TellScoresIntent = function (intent, session, response) {
        //tells the scores in the leaderboard and send the result in card.
        storage.loadMedList(session, function (medList) {
            var sortedPlayerScores = [],
                continueSession,
                speechOutput = '',
                leaderboard = '';
            if (medList.data.medications.length === 0) {
                response.tell('Nobody has joined the game.');
                return;
            }
            medList.data.medications.forEach(function (player) {
                sortedPlayerScores.push({
                    score: medList.data.dosages[player],
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
        storage.newMedList(session).save(function () {
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
