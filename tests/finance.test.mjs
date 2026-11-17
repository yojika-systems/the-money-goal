import test from 'node:test';
import assert from 'node:assert/strict';
import { futureValue, compareExpenses, debtPayoff, cardBreakEven } from '../src/lib/finance.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<.001,`${a} != ${b}`);
function independentlyAccumulate(payment,rate,years,timing){let total=0;for(let m=0;m<years*12;m++){if(timing==='start')total+=payment;total*=1+rate/12;if(timing==='end')total+=payment;}return total;}
test('investment formula agrees with an independent monthly ledger',()=>{for(const rate of [0,.12,-.15,1e-10])for(const timing of ['start','end'])close(futureValue(10000,rate,25,timing),independentlyAccumulate(10000,rate,25,timing));});
test('fee illustration reproduces the corrected published comparison',()=>{const r=compareExpenses({monthly:10000,years:25,gross:.12,lowFee:.002,highFee:.016});close(r.low,independentlyAccumulate(10000,.118,25,'start'));close(r.high,independentlyAccumulate(10000,.104,25,'start'));assert.equal(Math.round(r.difference/10000)/10,39.8);});
test('zero fees and zero contributions do not produce invented gains',()=>{assert.equal(futureValue(0,.12,20),0);assert.equal(futureValue(100,0,2),2400);assert.equal(compareExpenses({monthly:100,years:10,gross:0,lowFee:0,highFee:0}).difference,0);});
test('invalid investment assumptions are rejected',()=>{for(const bad of [NaN,Infinity,-1])assert.throws(()=>futureValue(bad,.12,10));assert.throws(()=>futureValue(100,-12,10));});
test('debt strategy uses the same budget and does not mutate inputs',()=>{const debts=[{balance:8000,apr:24,minimum:200},{balance:2000,apr:8,minimum:100}];const copy=structuredClone(debts);const a=debtPayoff(debts,500);const b=debtPayoff(debts,500,'snowball');assert.deepEqual(debts,copy);assert.ok(a.paidOff&&b.paidOff);assert.ok(a.interest<=b.interest);close(a.schedule.at(-1).balance,0);assert.ok(10000+a.interest<=a.months*500);assert.ok(10000+a.interest>(a.months-1)*500);});
test('zero-interest debts clear at the expected time',()=>{const r=debtPayoff([{balance:1000,apr:0,minimum:20}],100);assert.equal(r.months,10);assert.equal(r.interest,0);});
test('insufficient minimum budget and invalid debt values are rejected',()=>{assert.throws(()=>debtPayoff([{balance:1000,apr:20,minimum:100}],50));assert.throws(()=>debtPayoff([{balance:1000,apr:-1,minimum:10}],100));});
test('an unpaid debt returns an explicit incomplete result',()=>{const r=debtPayoff([{balance:10000,apr:100,minimum:1}],1,'avalanche',12);assert.equal(r.paidOff,false);assert.equal(r.months,12);});
test('card break-even compares incremental rewards',()=>{const r=cardBreakEven({spend:18000,fee:120,feeRate:.04,freeRate:.02});close(r.net,240);close(r.breakEven,6000);});
test('card exclusions, borrowing and caps can eliminate break-even',()=>{const r=cardBreakEven({spend:18000,excluded:6000,fee:120,feeRate:.04,freeRate:.02,interest:200,cap:200});assert.equal(r.breakEven,null);close(r.net,-360);assert.throws(()=>cardBreakEven({spend:100,excluded:200,fee:10,feeRate:.04,freeRate:.02}));});
test('equal rewards with a fee do not have a break-even point',()=>{assert.equal(cardBreakEven({spend:10000,fee:100,feeRate:.02,freeRate:.02}).breakEven,null);});
test('zero-cost equal rewards has a zero-spend break-even',()=>{assert.equal(cardBreakEven({spend:0,fee:0,feeRate:0,freeRate:0}).breakEven,0);});
test('a lower-fee input above the higher fee is rejected',()=>{assert.throws(()=>compareExpenses({monthly:100,years:10,gross:.1,lowFee:.02,highFee:.01}));});
