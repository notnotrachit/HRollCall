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
  private activeIntervals: { [topicId: string]: NodeJS.Timeout } = {}; // Track intervals in memory

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
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(`Attendance_${classAddress}`);

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const topicId = receipt.topicId!.toString();
      
      console.log(`Created topic ${topicId} for class ${classAddress}`);
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
      let lastTimestamp = Date.now();

      // Clean up any existing interval for this topic
      if (this.activeIntervals[topicId]) {
        clearInterval(this.activeIntervals[topicId]);
      }

      // Poll the mirror node REST API
      const pollMessages = async () => {
        try {
          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=100&order=desc`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Process new messages
          data.messages?.forEach((message: any) => {
            const messageTimestamp = new Date(message.consensus_timestamp).getTime();
            if (messageTimestamp > lastTimestamp) {
              try {
                const decodedMessage = Buffer.from(message.message, 'base64').toString();
                const messageData = JSON.parse(decodedMessage);
                console.log('New message received:', messageData);
                callback(messageData);
                lastTimestamp = messageTimestamp;
              } catch (error) {
                console.error('Error processing message:', error);
              }
            }
          });
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      };

      // Start polling and store the interval ID in memory
      const intervalId = setInterval(pollMessages, this.pollingInterval);
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
      clearInterval(intervalId);
    });
    this.activeIntervals = {};
  }
} 