export const createStreamResponse = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  return {
    send: (data) => {
        try{
            res.write(`data:${JSON.stringify(data)}\n\n`);
        } catch (error) {
            console.error('Error writing to stream:', error);
        }
    },
    end: () => {
        try{
            res.write('event: END\n\n"data":{"done":true}\n\n');
            res.end();
        }catch(error){
            console.error('Error ending stream:', error);
        }
        
    },
    error: (error) => {
        try{
            res.write(`data:${JSON.stringify(data)}\n\n`);
            res.end();
        }catch(error){
            console.error('Error writing error to stream:', error);
        }
    }
  }
}