/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
        http://aws.amazon.com/apache2.0/
    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var medicationHelper = (function () {

    return {
        getFrequency: function (frequencyString) {
            var frequency = 1;

            if(frequencyString === "daily"){
              return 1;
            }
            else if(frequencyString === "every other day"){
              return 2;
            }
            else{
              var frequencyArray = frequencyString.split(' ');

              for(var i=0; i<frequencyArray.length; i++){

                if(frequencyArray[i] === parseInt(frequencyArray[i], 10)){
                  frequency = frequencyArray[i];
                }

                else if(frequencyArray[i].contains('week')){
                  if(i > 0 && frequencyArray[i-1] === 'other'){
                    frequency *= 2;
                  }

                  frequency *= 7;
                }

                else if(frequencyArray[i].contains('month')){
                  if(i > 0 && frequencyArray[i-1] === 'other'){
                    frequency *= 2;
                  }

                  frequency *= 30;
                }
              }
            }
            return frequency;
        },

        getDayCount: function (durationString) {
          var dayCount = 1;
          var durationArray = durationString.split(' ');
          if (durationArray.length == 1)
          {
            switch (durationArray[0]) {
              case 'day':
                dayCount = 1;
                break;
              case 'week':
                dayCount = 7;
                break;
              case 'month':
                dayCount = 30;
                break;
              case 'year':
                dayCount = 365;
                break;
              default:
                dayCount = 1;
            }
          }
          else
          {
            dayCount = parseInt(durationArray[0], 10);
            if (durationArray[1].includes('day'))
            {
                dayCount *= 1;
            }
            else if (durationArray[1].includes('week'))
            {
                dayCount *= 7;
            }
            else if (durationArray[1].includes('month'))
            {
                dayCount *= 30;
            }
            else if (durationArray[1].includes('year'))
            {
                dayCount *= 365;
            }
          }
          return dayCount;
        }
    };
})();
module.exports = medicationHelper;
