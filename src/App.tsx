import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Alert,
  Container,
  Typography,
  Box,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { toast } from 'sonner';

// Constants
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const RANDOM_WORD_API = 'https://random-word-api.herokuapp.com';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const twinkle = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0a192f',
    },
    secondary: {
      main: '#64ffda',
    },
    background: {
      default: '#e6f3ff',
    },
  },
});

// Styled Components
const AnimatedContainer = styled(Container)`
  animation: ${fadeIn} 0.5s ease-out;
`;

const LetterBox = styled(Box)(
  ({ status }: { status: 'correct' | 'present' | 'absent' | 'empty' }) => ({
    width: 60,
    height: 60,
    border: '2px solid #ccc',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: 3,
    transition: 'all 0.3s ease',
    animation: `${pulse} 0.3s ease-in-out`,
    backgroundColor:
      status === 'correct'
        ? '#4caf50'
        : status === 'present'
        ? '#ff9800'
        : status === 'absent'
        ? '#9e9e9e'
        : '#ffffff',
    color: status === 'empty' ? 'black' : 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  }),
);

const Navbar = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '80px',
  backgroundColor: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  padding: '0 20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  zIndex: 1000,
}));

const LoadingScreen = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const TwinklingLogo = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
  animation: `${twinkle} 1.5s ease-in-out infinite`,
}));

interface GuessProps {
  guess: string;
  targetWord: string;
  isSubmitted: boolean;
}

async function isValidWord(word: string): Promise<boolean> {
  try {
    const response = await fetch(`${DICTIONARY_API}/${word.toLowerCase()}`);
    return response.ok;
  } catch (error) {
    console.error('Error validating word:', error);
    return false;
  }
}

async function getRandomWord(): Promise<string> {
  try {
    const response = await fetch(`${RANDOM_WORD_API}/word?length=5`);
    const [word] = await response.json();
    const isValid = await isValidWord(word);
    if (isValid) {
      return word.toUpperCase();
    } else {
      return getRandomWord();
    }
  } catch (error) {
    console.error('Error fetching random word:', error);
    const fallbackWords = ['REACT', 'WORLD', 'CLONE', 'BUILD'];
    return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
  }
}

function GuessRow({ guess, targetWord, isSubmitted }: GuessProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      {Array.from({ length: WORD_LENGTH }).map((_, index) => {
        const letter = guess[index];
        let status: 'correct' | 'present' | 'absent' | 'empty' = 'empty';
        if (isSubmitted && letter) {
          if (letter === targetWord[index]) {
            status = 'correct';
          } else if (targetWord.includes(letter)) {
            status = 'present';
          } else {
            status = 'absent';
          }
        }
        return (
          <LetterBox
            key={index}
            status={status}
          >
            {letter || ''}
          </LetterBox>
        );
      })}
    </Box>
  );
}

function App() {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorShown, setErrorShown] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    startNewGame();
  }, []);

  async function startNewGame() {
    const newWord = await getRandomWord();
    setTargetWord(newWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
    setLoading(false);
    setErrorShown(false);
  }

  async function handleSubmitGuess() {
    if (currentGuess.length !== WORD_LENGTH) {
      if (!errorShown) {
        toast.error('Word must be 5 letters long');
        setErrorShown(true);
      }
      return;
    }

    if (!(await isValidWord(currentGuess))) {
      if (!errorShown) {
        toast.error('Not a valid word');
        setErrorShown(true);
      }
      return;
    }

    setErrorShown(false);
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (currentGuess === targetWord) {
      setGameOver(true);
      setWon(true);
      toast.success('Congratulations! You won!');
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameOver(true);
    }
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <LoadingScreen>
          <TwinklingLogo variant='h3'>Wordle Clone</TwinklingLogo>
        </LoadingScreen>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          paddingTop: '60px',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Navbar>
          <Box
            sx={{
              position: 'relative',
              top: '50px',
              left: '20px',
              padding: '5px',
              backgroundColor: '#0a192f',
              borderRadius: '8px',
            }}
          >
            <img
              src='/logo.png'
              alt='Wordle Clone Logo'
              style={{
                height: '140px',
                display: 'block',
              }}
            />
          </Box>
        </Navbar>
        <AnimatedContainer
          maxWidth='sm'
          sx={{
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: 'calc(100vh - 60px)',
            mt: 2,
          }}
        >
          <Box sx={{ mb: 2 }}>
            {Array.from({ length: MAX_ATTEMPTS }).map((_, index) => (
              <GuessRow
                key={index}
                guess={
                  index < guesses.length
                    ? guesses[index]
                    : index === guesses.length
                    ? currentGuess
                    : ''
                }
                targetWord={targetWord}
                isSubmitted={index < guesses.length}
              />
            ))}
          </Box>

          {!gameOver && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                value={currentGuess}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  if (value.length <= WORD_LENGTH && /^[A-Z]*$/.test(value)) {
                    setCurrentGuess(value);
                    setErrorShown(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmitGuess();
                    e.preventDefault();
                  }
                }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 0 0 2px rgba(106, 27, 154, 0.2)',
                    },
                  },
                }}
                placeholder='Type your guess'
              />
              <Button
                variant='contained'
                onClick={handleSubmitGuess}
                sx={{
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  },
                }}
              >
                Guess
              </Button>
            </Box>
          )}

          {gameOver && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert
                severity={won ? 'success' : 'error'}
                sx={{
                  borderRadius: '8px',
                  animation: `${fadeIn} 0.5s ease-out`,
                }}
              >
                {won
                  ? `Congratulations! You won in ${guesses.length} ${
                      guesses.length === 1 ? 'try' : 'tries'
                    }!`
                  : `Game Over! The word was ${targetWord}`}
              </Alert>
              <Button
                variant='contained'
                onClick={startNewGame}
                disabled={loading}
                sx={{
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  },
                }}
              >
                Play Again
              </Button>
            </Box>
          )}
        </AnimatedContainer>
      </Box>
    </ThemeProvider>
  );
}

export default App;
