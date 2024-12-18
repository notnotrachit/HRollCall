/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  Client, 
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  AccountId,
  PrivateKey
} from "@hashgraph/sdk";

export class HederaService {
  private client: Client;
  private pollingInterval: number = 2000; // Poll every 2 seconds
  private activeIntervals: { [topicId: string]: number } = {}; // Track intervals in memory

  constructor() {
    this.client = Client.forTestnet();
    
    const operatorId = import.meta.env.VITE_OPERATOR_ID;
    const operatorKey = import.meta.env.VITE_OPERATOR_KEY;
    
    if (!operatorId || !operatorKey) {
      throw new Error('Hedera credentials not found in environment variables');
    }

    this.client.setOperator(
      AccountId.fromString(operatorId), 
      PrivateKey.fromString(operatorKey)
    );
  }

  async createAttendanceTopic(classAddress: string): Promise<string> {
    try {
      console.log(`Creating attendance topic for class ${classAddress}`);
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(`Attendance_${classAddress}`);

      console.log('Executing topic creation transaction...');
      const txResponse = await transaction.execute(this.client);
      console.log('Getting transaction receipt...');
      const receipt = await txResponse.getReceipt(this.client);
      const topicId = receipt.topicId!.toString();
      
      console.log(`Successfully created topic ${topicId} for class ${classAddress}`);
      return topicId;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  async submitAttendance(topicId: string, attendanceData: {
    studentAddress: string;
    lectureId: number;
    timestamp: number;
    signature: string;
  }): Promise<void> {
    try {
      const message = JSON.stringify(attendanceData);
      
      const transaction = new TopicMessageSubmitTransaction({
        topicId: TopicId.fromString(topicId),
        message
      });

      const txResponse = await transaction.execute(this.client);
      await txResponse.getReceipt(this.client);
      
      console.log(`Submitted attendance to topic ${topicId}`);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      throw error;
    }
  }

  subscribeToAttendance(topicId: string, callback: (message: any) => void): void {
    try {
      console.log(`Setting up polling for topic ${topicId}`);
      let lastTimestamp = new Date().toISOString();

      // Clean up any existing interval for this topic
      if (this.activeIntervals[topicId]) {
        window.clearInterval(this.activeIntervals[topicId]);
      }

      // Helper function to decode base64
      const decodeBase64 = (base64: string): string => {
        try {
          // Convert base64 to text using browser's atob
          const binaryString = atob(base64);
          // Convert binary string to UTF-8 text
          return decodeURIComponent(escape(binaryString));
        } catch (error) {
          console.error('Error decoding base64:', error);
          throw error;
        }
      };

      // Poll the mirror node REST API
      const pollMessages = async () => {
        try {
          console.log(`Polling messages for topic ${topicId} since ${lastTimestamp}`);
          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=100&order=desc`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log(`Received ${data.messages?.length || 0} messages for topic ${topicId}:`, data);
          
          // Process new messages
          if (data.messages && data.messages.length > 0) {
            data.messages.forEach((message: any) => {
              try {
                // Convert Hedera timestamp (e.g., "1234567890.000000000") to ISO string
                const [seconds, nanos] = message.consensus_timestamp.split('.');
                const timestamp = new Date(Number(seconds) * 1000).toISOString();
                
                if (timestamp > lastTimestamp) {
                  try {
                    const decodedMessage = decodeBase64(message.message);
                    console.log(`Decoded message for topic ${topicId}:`, decodedMessage);
                    const messageData = JSON.parse(decodedMessage);
                    console.log('Parsed message data:', messageData);
                    callback(messageData);
                    lastTimestamp = timestamp;
                  } catch (error) {
                    console.error('Error processing message content:', error);
                  }
                } else {
                  console.log(`Skipping message from ${timestamp} as it's older than ${lastTimestamp}`);
                }
              } catch (error) {
                console.error('Error processing message timestamp:', error, message);
              }
            });
          } else {
            console.log(`No new messages found for topic ${topicId}`);
          }
        } catch (error) {
          console.error(`Error polling messages for topic ${topicId}:`, error);
        }
      };

      // Run once immediately
      pollMessages();

      // Then start polling
      const intervalId = window.setInterval(pollMessages, this.pollingInterval);
      this.activeIntervals[topicId] = intervalId;
      
      console.log(`Successfully set up polling for topic ${topicId}`);
    } catch (error) {
      console.error(`Error setting up polling for topic ${topicId}:`, error);
      throw error;
    }
  }

  // Clean up polling intervals
  cleanupSubscriptions(): void {
    Object.values(this.activeIntervals).forEach(intervalId => {
      window.clearInterval(intervalId);
    });
    this.activeIntervals = {};
  }
} 