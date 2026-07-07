import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  CLEARE_MESSAGE_PAYMENT,
  GET_ADD_NEW_CARD_PAYMENT,
  GET_ALL_CARD_PAYMENT,
  GET_DELETE_CARD_PAYMENT,
  GET_MAKE_DEFAULT_CARD_PAYMENT,
} from "../../Redux/Reducers/paymentReducer";
import { 
  Alert, 
  AlertTitle, 
  Box, 
  Button, 
  Tooltip, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Paper,
  Stack,
  Divider
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { blue, green, orange, red } from "@mui/material/colors";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { useNavigate } from "react-router-dom";

const validateYupSchema = Yup.object().shape({
  cardholderName: Yup.string()
    .required("Required")
    .matches(/^[^\d]+$/, "Cardholder name should not contain digits."),
  cardNumber: Yup.string()
    .required("Required")
    .matches(/^(\d{15}|\d{16})$/, "Card number must be 15 or 16 digits"),
  cardExpiration: Yup.string()
    .required("Required")
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid MM/YY format"),
  cvv: Yup.string()
    .required("Required")
    .matches(/^\d{3}$/, "3 Digits"),
});

function Payment() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const payment = useSelector((state) => state.payment);
  const [addNewCard, setAddNewCard] = useState(false);

  useEffect(() => {
    if (payment.message) {
      toast.success(payment.message);
      dispatch({ type: GET_ALL_CARD_PAYMENT });
      dispatch({ type: CLEARE_MESSAGE_PAYMENT });
    }
  }, [payment.message]);

  useEffect(() => {
    dispatch({ type: GET_ALL_CARD_PAYMENT });
  }, []);

  function handleDeleteCard(id) {
    dispatch({
      type: GET_DELETE_CARD_PAYMENT,
      payload: { _id: id },
    });
  }

  function handleCheckout() {
    navigate("/user/defaultcreds");
  }

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold", color: "#333" }}>
            Payment Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={addNewCard ? <RemoveIcon /> : <AddIcon />}
              onClick={() => setAddNewCard(!addNewCard)}
            >
              {addNewCard ? "Cancel" : "Add Custom Card"}
            </Button>
            <Button
              variant="contained"
              onClick={handleCheckout}
              sx={{ bgcolor: orange[500], "&:hover": { bgcolor: orange[700] } }}
            >
              Checkout
            </Button>
          </Box>

          {addNewCard && (
            <Box sx={{ p: 3, border: "2px solid #a1eaa1", borderRadius: 2, mb: 3, bgcolor: "#fdfdfd" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Add Custom Card:
              </Typography>
              {payment.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <AlertTitle>Error</AlertTitle>
                  {payment.error}
                </Alert>
              )}

              <Formik
                initialValues={{
                  cardNumber: "",
                  cardExpiration: "",
                  cardholderName: "",
                  cvv: "",
                }}
                validationSchema={validateYupSchema}
                onSubmit={(values, { resetForm }) => {
                  dispatch({
                    type: GET_ADD_NEW_CARD_PAYMENT,
                    payload: values,
                  });
                  resetForm();
                  setAddNewCard(false);
                }}
              >
                {({ handleSubmit, touched, errors }) => (
                  <Form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Cardholder's Name"
                          name="cardholderName"
                          placeholder="John Doe"
                          error={touched.cardholderName && Boolean(errors.cardholderName)}
                          helperText={touched.cardholderName && errors.cardholderName}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Card Number"
                          name="cardNumber"
                          placeholder="1234567890123456"
                          error={touched.cardNumber && Boolean(errors.cardNumber)}
                          helperText={touched.cardNumber && errors.cardNumber}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Expiration Date (MM/YY)"
                          name="cardExpiration"
                          placeholder="12/28"
                          error={touched.cardExpiration && Boolean(errors.cardExpiration)}
                          helperText={touched.cardExpiration && errors.cardExpiration}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="CVV"
                          name="cvv"
                          type="password"
                          placeholder="123"
                          error={touched.cvv && Boolean(errors.cvv)}
                          helperText={touched.cvv && errors.cvv}
                        />
                      </Grid>
                      <Grid item xs={12} sx={{ display: "flex", justifyContent: "end", mt: 1 }}>
                        <Button
                          variant="contained"
                          disabled={payment.loading}
                          type="submit"
                          endIcon={<SendIcon />}
                        >
                          {payment.loading ? "Adding..." : "Add card"}
                        </Button>
                      </Grid>
                    </Grid>
                  </Form>
                )}
              </Formik>
            </Box>
          )}

          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", mt: 2 }}>
            Saved Custom Cards:
          </Typography>

          <Stack spacing={2}>
            {payment.allCards && payment.allCards.length > 0 ? (
              payment.allCards.map((card) => (
                <Paper
                  elevation={3}
                  sx={{
                    p: 2.5,
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    position: "relative",
                  }}
                  key={card._id}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <img
                        style={{ height: "30px", width: "auto" }}
                        src="https://img.icons8.com/color/48/000000/mastercard-logo.png"
                        alt="card-brand"
                      />
                      <Box>
                        <Typography sx={{ fontWeight: "bold" }}>
                          {card.cardholderName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          **** **** **** {card.lastFourDigits}
                        </Typography>
                      </Box>
                    </Box>
                    {card.isCardDefault && (
                      <Tooltip title="Default Card">
                        <BookmarkIcon sx={{ color: green["A700"] }} />
                      </Tooltip>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "end", gap: 1 }}>
                    {!card.isCardDefault && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          dispatch({
                            type: GET_MAKE_DEFAULT_CARD_PAYMENT,
                            payload: { _id: card._id },
                          })
                        }
                        startIcon={<BookmarkAddIcon />}
                      >
                        Make Default
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteCard(card._id)}
                      startIcon={<DeleteOutlineIcon />}
                    >
                      Delete
                    </Button>
                  </Box>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                No saved custom cards found. Feel free to add a new card above.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Payment;
